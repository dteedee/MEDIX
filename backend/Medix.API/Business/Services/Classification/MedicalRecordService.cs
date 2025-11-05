using AutoMapper;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
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

        public MedicalRecordService(
            IMedicalRecordRepository medicalRecordRepo,
            IAppointmentRepository appointmentRepo,
            IMapper mapper)
        {
            _medicalRecordRepo = medicalRecordRepo;
            _appointmentRepo = appointmentRepo;
            _mapper = mapper;
        }

        public async Task<MedicalRecordDto?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(appointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Không tìm thấy cuộc hẹn này.");

            var record = await _medicalRecordRepo.GetByPatientIdAsync(appointment.PatientId);
            if (record == null)
                throw new InvalidOperationException("Không tìm thấy bệnh án cho bệnh nhân này.");

            var dto = _mapper.Map<MedicalRecordDto>(record);

            dto.AppointmentId = appointment.Id;
            dto.AppointmentDate = appointment.AppointmentStartTime;
            dto.DoctorName = appointment.Doctor?.User?.FullName ?? "Không rõ bác sĩ";

            return dto;
        }


        // ✅ Tạo mới hồ sơ bệnh án
        public async Task<MedicalRecordDto> CreateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            // Kiểm tra bệnh nhân đã có hồ sơ chưa
            var existingRecord = await _medicalRecordRepo.GetByPatientIdAsync(appointment.PatientId);
            if (existingRecord != null)
                throw new InvalidOperationException("Medical record already exists for this patient.");

            var record = _mapper.Map<MedicalRecord>(dto);
            record.Id = Guid.NewGuid();
            record.AppointmentId = dto.AppointmentId;
            record.CreatedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

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
            return _mapper.Map<MedicalRecordDto>(record);
        }

        // ✅ Cập nhật hồ sơ bệnh án
        public async Task<MedicalRecordDto> UpdateAsync(CreateOrUpdateMedicalRecordDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new InvalidOperationException("Appointment not found.");

            var existingRecord = await _medicalRecordRepo.GetByPatientIdAsync(appointment.PatientId);
            if (existingRecord == null)
                throw new InvalidOperationException("Medical record not found for this patient.");

            // Cập nhật thông tin chính
            existingRecord.ChiefComplaint = dto.ChiefComplaint;
            existingRecord.PhysicalExamination = dto.PhysicalExamination;
            existingRecord.Diagnosis = dto.Diagnosis;
            existingRecord.AssessmentNotes = dto.AssessmentNotes;
            existingRecord.TreatmentPlan = dto.TreatmentPlan;
            existingRecord.FollowUpInstructions = dto.FollowUpInstructions;
            existingRecord.DoctorNotes = dto.DoctorNotes;
            existingRecord.UpdatedAt = DateTime.UtcNow;

            // Cập nhật đơn thuốc
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
            return _mapper.Map<MedicalRecordDto>(existingRecord);
        }

        public async Task<List<MedicalRecord>> GetRecordsByUserIdAsync(Guid userId, MedicalRecordQuery query)
            => await _medicalRecordRepo.GetRecordsByUserIdAsync(userId, query);

        public async Task<MedicalRecord?> GetRecordDetailsByIdAsync(Guid id)
            => await _medicalRecordRepo.GetRecordDetailsByIdAsync(id);
    }
}
