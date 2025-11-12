using AutoMapper;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Business.Services.Classification
{
    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly IMedicalRecordRepository _medicalRecordRepo;
        private readonly IAppointmentRepository _appointmentRepo;
        private readonly IMapper _mapper;
        private readonly MedixContext _context; // 🩺 Thêm DbContext để update Patient

        public MedicalRecordService(
            IMedicalRecordRepository medicalRecordRepo,
            IAppointmentRepository appointmentRepo,
            IMapper mapper,
            MedixContext context)
        {
            _medicalRecordRepo = medicalRecordRepo;
            _appointmentRepo = appointmentRepo;
            _mapper = mapper;
            _context = context;
        }

        public async Task<MedicalRecordDto?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var record = await _medicalRecordRepo.GetByAppointmentIdAsync(appointmentId);
            if (record == null)
                return null;

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto> CreateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            // 🔹 Kiểm tra hồ sơ đã tồn tại cho cuộc hẹn này chưa
            var existingRecord = await _medicalRecordRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (existingRecord != null)
                throw new InvalidOperationException("Medical record already exists for this appointment.");

            var record = _mapper.Map<MedicalRecord>(dto);
            record.Id = Guid.NewGuid();
            record.AppointmentId = dto.AppointmentId;
            record.CreatedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            // 🔹 Thêm danh sách đơn thuốc nếu có
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

            // 🩺 Cập nhật tiền sử bệnh hoặc dị ứng nếu được chọn
            await UpdatePatientHistoryAndAllergiesAsync(appointment.PatientId, dto);

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto> UpdateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            // 🔹 Tìm hồ sơ của chính cuộc hẹn này
            var existingRecord = await _medicalRecordRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (existingRecord == null)
                throw new InvalidOperationException("Medical record not found for this appointment.");

            // --- Cập nhật nội dung ---
            existingRecord.ChiefComplaint = dto.ChiefComplaint;
            existingRecord.PhysicalExamination = dto.PhysicalExamination;
            existingRecord.Diagnosis = dto.Diagnosis;
            existingRecord.AssessmentNotes = dto.AssessmentNotes;
            existingRecord.TreatmentPlan = dto.TreatmentPlan;
            existingRecord.FollowUpInstructions = dto.FollowUpInstructions;
            existingRecord.DoctorNotes = dto.DoctorNotes;
            existingRecord.UpdatedAt = DateTime.UtcNow;

            // --- Cập nhật đơn thuốc ---
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
                    CreatedAt = DateTime.UtcNow
                }).ToList();
            }

            await _medicalRecordRepo.UpdateAsync(existingRecord);

            // 🩺 Cập nhật tiền sử bệnh hoặc dị ứng nếu có yêu cầu
            await UpdatePatientHistoryAndAllergiesAsync(appointment.PatientId, dto);

            return _mapper.Map<MedicalRecordDto>(existingRecord);
        }

        // 🔹 Hàm xử lý cập nhật tiền sử bệnh và dị ứng
        private async Task UpdatePatientHistoryAndAllergiesAsync(Guid patientId, CreateOrUpdateMedicalRecordDto dto)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
            if (patient == null) return;

            bool updated = false;

            if (dto.UpdatePatientMedicalHistory && !string.IsNullOrWhiteSpace(dto.Diagnosis))
            {
                // nối thêm nếu chưa có
                if (string.IsNullOrWhiteSpace(patient.MedicalHistory))
                    patient.MedicalHistory = dto.Diagnosis;
                else if (!patient.MedicalHistory.Contains(dto.Diagnosis, StringComparison.OrdinalIgnoreCase))
                    patient.MedicalHistory += $"; {dto.Diagnosis}";

                updated = true;
            }

            if (dto.UpdatePatientAllergies && !string.IsNullOrWhiteSpace(dto.NewAllergy))
            {
                if (string.IsNullOrWhiteSpace(patient.Allergies))
                    patient.Allergies = dto.NewAllergy;
                else if (!patient.Allergies.Contains(dto.NewAllergy, StringComparison.OrdinalIgnoreCase))
                    patient.Allergies += $"; {dto.NewAllergy}";

                updated = true;
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
        {
            return await _medicalRecordRepo.GetRecordDetailsByIdAsync(id);
        }


    }
}
