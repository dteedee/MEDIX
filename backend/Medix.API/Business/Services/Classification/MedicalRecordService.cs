
using AutoMapper;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Drawing;
using QuestPDF.Infrastructure;
using System.Text.RegularExpressions;
using QuestPDF.Fluent;
using QuestPDF.Helpers;


namespace Medix.API.Business.Services.Classification
{
    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly IMedicalRecordRepository _medicalRecordRepo;
        private readonly IAppointmentRepository _appointmentRepo;
        private readonly IMapper _mapper;
        private readonly IPatientHealthReminderService patientHealthReminderService; 
        private readonly IPatientRepository _patientRepository;
        private readonly MedixContext _context; 

        public MedicalRecordService(
            IMedicalRecordRepository medicalRecordRepo,
            IAppointmentRepository appointmentRepo,
            IMapper mapper,
            MedixContext context,
            IPatientHealthReminderService patientHealthReminderService,
            IPatientRepository patientRepository)
        {
            _medicalRecordRepo = medicalRecordRepo;
            _appointmentRepo = appointmentRepo;
            _mapper = mapper;
            _context = context;
            this.patientHealthReminderService = patientHealthReminderService;
            _patientRepository = patientRepository;
        }

        public async Task<MedicalRecordDto?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var record = await _medicalRecordRepo.GetByAppointmentIdAsync(appointmentId);
            if (record == null)
                return null;
            var result = _mapper.Map<MedicalRecordDto>(record);
            result.StatusAppointment = record.Appointment.StatusCode;
            result.AppointmentEndDate = record.Appointment.AppointmentEndTime;
            result.AppointmentStartDate = record.Appointment.AppointmentStartTime;
            return result ;
        }

        public async Task<MedicalRecordDto> CreateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            var existingRecord = await _medicalRecordRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (existingRecord != null)
                throw new InvalidOperationException("Medical record already exists for this appointment.");

            var record = _mapper.Map<MedicalRecord>(dto);
            record.Id = Guid.NewGuid();
            record.AppointmentId = dto.AppointmentId;
            record.CreatedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;
            record.Diagnosis = !string.IsNullOrWhiteSpace(dto.Diagnosis) ? NormalizeString(dto.Diagnosis) : dto.Diagnosis;

            if (dto.Prescriptions != null && dto.Prescriptions.Any())
            {
                record.Prescriptions = dto.Prescriptions.Select(p => new Prescription
                {
                    Id = Guid.NewGuid(),
                    MedicationName = p.MedicationName,
                    Dosage = p.Dosage,
                    Frequency = p.Frequency,
                    Duration = p.Duration,
                    Instructions = p.Instructions,
                    CreatedAt = DateTime.UtcNow
                }).ToList();
            }

            await _medicalRecordRepo.AddAsync(record);

            await UpdatePatientHistoryAndAllergiesAsync(appointment.PatientId, dto, appointment.AppointmentStartTime);

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto> UpdateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            var existingRecord = await _medicalRecordRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (existingRecord == null)
                throw new InvalidOperationException("Medical record not found for this appointment.");

            existingRecord.ChiefComplaint = dto.ChiefComplaint;
            existingRecord.PhysicalExamination = dto.PhysicalExamination;
            existingRecord.Diagnosis = !string.IsNullOrWhiteSpace(dto.Diagnosis) ? NormalizeString(dto.Diagnosis) : dto.Diagnosis;
            existingRecord.AssessmentNotes = dto.AssessmentNotes;
            existingRecord.TreatmentPlan = dto.TreatmentPlan;
            existingRecord.FollowUpInstructions = dto.FollowUpInstructions;
            existingRecord.DoctorNotes = dto.DoctorNotes;
            existingRecord.UpdatedAt = DateTime.UtcNow;

            existingRecord.Prescriptions.Clear();
            if (dto.Prescriptions != null && dto.Prescriptions.Any())
            {
                existingRecord.Prescriptions = dto.Prescriptions.Select(p => new Prescription
                {
                    Id = Guid.NewGuid(),
                    MedicationName = p.MedicationName,
                    Dosage = p.Dosage,
                    Frequency = p.Frequency,
                    Duration = p.Duration,
                    Instructions = p.Instructions,
                    CreatedAt = DateTime.UtcNow,
                    MedicalRecordId = existingRecord.Id,
                    MedicalRecord = existingRecord

                }).ToList();

                await patientHealthReminderService.sendHealthReminderPrescription((List<Prescription>)existingRecord.Prescriptions);
            }

            await _medicalRecordRepo.UpdateAsync(existingRecord);

            await UpdatePatientHistoryAndAllergiesAsync(appointment.PatientId, dto, appointment.AppointmentStartTime);

            return _mapper.Map<MedicalRecordDto>(existingRecord);
        }

        private string NormalizeString(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var trimmed = input.Trim();
            var normalized = Regex.Replace(trimmed, @"\s+", " ");
            return normalized.ToUpper();
        }

        private async Task UpdatePatientHistoryAndAllergiesAsync(Guid patientId, CreateOrUpdateMedicalRecordDto dto, DateTime? appointmentDate = null)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
            if (patient == null) return;

            bool updated = false;

            if (dto.UpdatePatientMedicalHistory && !string.IsNullOrWhiteSpace(dto.Diagnosis))
            {
                var normalizedDiagnosis = NormalizeString(dto.Diagnosis);

                bool diagnosisExists = false;
                if (!string.IsNullOrWhiteSpace(patient.MedicalHistory))
                {
                    var existingDiseases = patient.MedicalHistory
                        .Split(';', StringSplitOptions.RemoveEmptyEntries)
                        .Select(d => NormalizeString(d))
                        .Where(d => !string.IsNullOrWhiteSpace(d))
                        .Distinct()
                        .ToList();

                    diagnosisExists = existingDiseases.Contains(normalizedDiagnosis);
                }

                if (!diagnosisExists)
                {
                    if (string.IsNullOrWhiteSpace(patient.MedicalHistory))
                    {
                        patient.MedicalHistory = normalizedDiagnosis;
                        updated = true;
                    }
                    else
                    {
                        var existingDiseases = patient.MedicalHistory
                            .Split(';', StringSplitOptions.RemoveEmptyEntries)
                            .Select(d => NormalizeString(d))
                            .Where(d => !string.IsNullOrWhiteSpace(d))
                            .Distinct()
                            .ToList();

                        existingDiseases.Add(normalizedDiagnosis);
                        patient.MedicalHistory = string.Join("; ", existingDiseases);
                        updated = true;
                    }
                }
            }

            if (dto.UpdatePatientAllergies && !string.IsNullOrWhiteSpace(dto.NewAllergy))
            {
                var normalizedAllergy = NormalizeString(dto.NewAllergy);

                bool allergyExists = false;
                if (!string.IsNullOrWhiteSpace(patient.Allergies))
                {
                    var existingAllergies = patient.Allergies
                        .Split(';', StringSplitOptions.RemoveEmptyEntries)
                        .Select(a => NormalizeString(a))
                        .Where(a => !string.IsNullOrWhiteSpace(a))
                        .Distinct()
                        .ToList();

                    allergyExists = existingAllergies.Contains(normalizedAllergy);
                }

                if (!allergyExists)
                {
                    if (string.IsNullOrWhiteSpace(patient.Allergies))
                    {
                        patient.Allergies = normalizedAllergy;
                        updated = true;
                    }
                    else
                    {
                        var existingAllergies = patient.Allergies
                            .Split(';', StringSplitOptions.RemoveEmptyEntries)
                            .Select(a => NormalizeString(a))
                            .Where(a => !string.IsNullOrWhiteSpace(a))
                            .Distinct()
                            .ToList();

                        existingAllergies.Add(normalizedAllergy);
                        patient.Allergies = string.Join("; ", existingAllergies);
                        updated = true;
                    }
                }
            }

            if (dto.UpdatePatientDiseaseHistory && !string.IsNullOrWhiteSpace(dto.PhysicalExamination))
            {
                var normalizedPhysicalExamination = NormalizeString(dto.PhysicalExamination);
                
                var dateStr = appointmentDate?.ToString("dd/MM/yyyy") ?? DateTime.UtcNow.ToString("dd/MM/yyyy");
                var diseaseHistoryEntry = $"[{dateStr}] - {normalizedPhysicalExamination}";

                bool entryExists = false;
                if (!string.IsNullOrWhiteSpace(patient.DiseaseHistory))
                {
                    var existingEntries = patient.DiseaseHistory.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var entry in existingEntries)
                    {
                        if (entry.Trim() == diseaseHistoryEntry)
                        {
                            entryExists = true;
                            break;
                        }
                    }
                }

                if (!entryExists)
                {
                    if (string.IsNullOrWhiteSpace(patient.DiseaseHistory))
                    {
                        patient.DiseaseHistory = diseaseHistoryEntry;
                        updated = true;
                    }
                    else
                    {
                        patient.DiseaseHistory += $"\n{diseaseHistoryEntry}";
                        updated = true;
                    }
                }
            }

            if (updated)
            {
                patient.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<MedicalRecord>> GetRecordsByUserIdAsync(Guid userId, MedicalRecordQuery query)
            => await _medicalRecordRepo.GetRecordsByUserIdAsync(userId, query);

        public async Task<MedicalRecord?> GetRecordDetailsByIdAsync(Guid id)
            => await _medicalRecordRepo.GetRecordDetailsByIdAsync(id);

        public async Task<MedicalRecordPdfDto> CreateEMRAsPDFAsync(Guid userId, CancellationToken cancellationToken)
        {
            // Set license (Community license is free for non-commercial use)
            QuestPDF.Settings.License = LicenseType.Community;

            var patient = await _patientRepository.GetPatientByUserIdAsync(userId);

            if (patient == null)
            {
                throw new ArgumentException($"Patient with userId = {userId} can not be found.");
            }

            var user = patient.User;
            var records = await _medicalRecordRepo.GetRecordsByUserIdAsync(userId);

            // Register Vietnamese font support
            RegisterVietnameseFont();

            // Generate PDF
            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    // Page settings
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Roboto"));

                    // Content
                    page.Content().Column(column =>
                    {
                        column.Spacing(5);

                        // Title
                        column.Item().AlignCenter().Text("Hồ sơ y tế")
                            .FontSize(20)
                            .Bold();

                        column.Item().PaddingTop(10);

                        // Section 1: Personal Information
                        column.Item().Text("1. Thông tin cá nhân")
                            .FontSize(14)
                            .Bold();

                        column.Item().Text($"Họ và tên: {user.FullName}");
                        column.Item().Text($"Số CCCD: {user.IdentificationNumber}");
                        column.Item().Text($"Địa chỉ liên lạc: {user.Address}");
                        column.Item().Text($"Email: {user.Email}");
                        column.Item().Text($"Số điện thoại: {user.PhoneNumber}");

                        column.Item().PaddingTop(10);

                        // Section 2: Medical Information
                        column.Item().Text("2. Thông tin y tế")
                            .FontSize(14)
                            .Bold();

                        column.Item().Text($"Mã số EMR: {patient.MedicalRecordNumber}");
                        column.Item().Text($"Ngày sinh: {user.DateOfBirth!.Value:dd/MM/yyyy}");
                        column.Item().Text($"Giới tính: {user.GenderCodeNavigation!.DisplayName}");
                        column.Item().Text($"Nhóm máu: {patient.BloodTypeCode}");
                        column.Item().Text($"Dị ứng: {patient.Allergies}");

                        column.Item().PaddingTop(10);

                        // Section 3: Emergency Contact
                        column.Item().Text("3. Người liên hệ khẩn cấp")
                            .FontSize(14)
                            .Bold();

                        column.Item().Text($"Họ và tên người liên hệ: {patient.EmergencyContactName}");
                        column.Item().Text($"Số điện thoại người liên hệ: {patient.EmergencyContactPhone}");

                        column.Item().PaddingTop(10);

                        // Section 4: Medical History
                        column.Item().Text("4. Lịch sử khám")
                            .FontSize(14)
                            .Bold();

                        foreach (var record in records)
                        {
                            column.Item().PaddingTop(10);
                            column.Item().Text($"Ngày khám: {record.CreatedAt:dd/MM/yyyy HH:mm}");
                            column.Item().Text($"Bác sĩ phụ trách: {record.Appointment.Doctor.User.FullName}");
                            column.Item().Text($"Lý do khám & Triệu chứng: {record.ChiefComplaint}");
                            column.Item().Text($"Chẩn đoán: {record.Diagnosis}");
                            column.Item().Text($"Kế hoạch điều trị: {record.TreatmentPlan}");
                        }
                    });
                });
            }).GeneratePdf();

            return new MedicalRecordPdfDto
            {
                Data = pdfBytes,
                FileName = $"{user.FullName}_EMR",
            };
        }

        private void RegisterVietnameseFont()
        {
            // Download Roboto font and place in your project's Assets/Fonts folder
            // Or use system fonts on Linux
            var fontPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "Fonts");

            if (File.Exists(Path.Combine(fontPath, "Roboto-Regular.ttf")))
            {
                FontManager.RegisterFont(File.OpenRead(Path.Combine(fontPath, "Roboto-Regular.ttf")));
                FontManager.RegisterFont(File.OpenRead(Path.Combine(fontPath, "Roboto-Bold.ttf")));
            }
        }

    }
}
