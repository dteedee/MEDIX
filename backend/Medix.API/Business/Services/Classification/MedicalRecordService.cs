using Aspose.Pdf;
using Aspose.Pdf.Text;
using AutoMapper;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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
            var patient = await _patientRepository.GetPatientByUserIdAsync(userId);

            if (patient == null)
            {
                throw new ArgumentException($"Patient with userId = {userId} can not be found.");
            }

            var user = patient.User;

            var records = await _medicalRecordRepo.GetRecordsByUserIdAsync(userId);

            // Create PDF in memory
            using var document = new Document();
            var page = document.Pages.Add();

            page.Paragraphs.Add(CreateTitleText($"Hồ sơ y tế"));

            page.Paragraphs.Add(CreateText(string.Empty));

            page.Paragraphs.Add(CreateHeaderText($"1. Thông tin cá nhân"));
            page.Paragraphs.Add(CreateText($"Họ và tên: {user.FullName}"));
            page.Paragraphs.Add(CreateText($"Số CCCD: {user.IdentificationNumber}"));
            page.Paragraphs.Add(CreateText($"Địa chỉ liên lạc: {user.Address}"));
            page.Paragraphs.Add(CreateText($"Email: {user.Email}"));
            page.Paragraphs.Add(CreateText($"Số điện thoại: {user.PhoneNumber}"));

            page.Paragraphs.Add(CreateText(string.Empty));

            page.Paragraphs.Add(CreateHeaderText($"2. Thông tin y tế"));
            page.Paragraphs.Add(CreateText($"Mã số EMR: {patient.MedicalRecordNumber}"));
            page.Paragraphs.Add(CreateText($"Ngày sinh: {user.DateOfBirth!.Value:dd/MM/yyyy}"));
            page.Paragraphs.Add(CreateText($"Giới tính: {user.GenderCodeNavigation!.DisplayName}"));
            page.Paragraphs.Add(CreateText($"Nhóm máu: {patient.BloodTypeCode}"));
            page.Paragraphs.Add(CreateText($"Dị ứng: {patient.Allergies}"));

            page.Paragraphs.Add(CreateText(string.Empty));

            page.Paragraphs.Add(CreateHeaderText($"3. Người liên hệ khẩn cấp"));
            page.Paragraphs.Add(CreateText($"Họ và tên người liên hệ: {patient.EmergencyContactName}"));
            page.Paragraphs.Add(CreateText($"Số điện thoại người liên hệ: {patient.EmergencyContactPhone}"));

            page.Paragraphs.Add(CreateText(string.Empty));

            page.Paragraphs.Add(CreateHeaderText($"4. Lịch sử khám"));
            foreach (var record in records)
            {
                page.Paragraphs.Add(CreateText(string.Empty));

                page.Paragraphs.Add(CreateText($"Bác sĩ phụ trách: {record.Appointment.Doctor.User.FullName}"));
                page.Paragraphs.Add(CreateText($"Lý do khám & Triệu chứng: {record.ChiefComplaint}"));
                page.Paragraphs.Add(CreateText($"Chẩn đoán: {record.Diagnosis}"));
                page.Paragraphs.Add(CreateText($"Kế hoạch điều trị: {record.TreatmentPlan}"));
                page.Paragraphs.Add(CreateText($"Ngày khám: {record.CreatedAt}"));

                page.Paragraphs.Add(CreateText(string.Empty));
            }

            using var stream = new MemoryStream();
            await document.SaveAsync(stream, cancellationToken);
            return new MedicalRecordPdfDto
            {
                Data = stream.ToArray(),
                FileName = $"{user.FullName}_EMR",
            };
        }

        private TextFragment CreateTitleText(string text)
        {
            var textFragment = new TextFragment(text);
            textFragment.TextState.Font = FontRepository.FindFont("Arial");
            textFragment.TextState.FontSize = 20;
            textFragment.TextState.FontStyle = FontStyles.Bold;
            textFragment.HorizontalAlignment = HorizontalAlignment.Center;

            return textFragment;
        }

        private TextFragment CreateHeaderText(string text)
        {
            var textFragment = new TextFragment(text);
            textFragment.TextState.Font = FontRepository.FindFont("Arial");
            textFragment.TextState.FontSize = 14;
            textFragment.TextState.FontStyle = FontStyles.Bold;

            return textFragment;
        }

        private TextFragment CreateText(string text) {
            var textFragment = new TextFragment(text);
            textFragment.TextState.Font = FontRepository.FindFont("Arial");
            textFragment.TextState.FontSize = 12;

            return textFragment;
        }

    }
}
