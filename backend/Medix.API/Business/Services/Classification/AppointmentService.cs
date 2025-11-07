﻿using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IAppointmentRepository _repository;
        private readonly IMapper _mapper;

        public AppointmentService(IAppointmentRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }

        public async Task<AppointmentDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<AppointmentDto>(entity);
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto)
        {
            var entity = _mapper.Map<Appointment>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.AppointmentStartTime = (DateTime)dto.AppointmentStartTime;
            entity.AppointmentEndTime= (DateTime)dto.AppointmentEndTime;

            await _repository.CreateApppointmentAsync(entity);
            return _mapper.Map<AppointmentDto>(entity);
        }

        public async Task<AppointmentDto?> UpdateAsync(UpdateAppointmentDto dto)
        {
            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null) return null;

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing);
            return _mapper.Map<AppointmentDto>(existing);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDoctorAsync(Guid doctorId)
        {
            var list = await _repository.GetByDoctorAsync(doctorId);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByPatientAsync(Guid patientId)
        {
            var list = await _repository.GetByPatientAsync(patientId);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDateAsync(DateTime date)
        {
            var list = await _repository.GetByDateAsync(date);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }
        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateAsync(Guid userId, DateTime date)
        {
            // 1️⃣ Lấy Doctor tương ứng với UserId
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user.");

            // 2️⃣ Tính khoảng thời gian trong ngày
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            // 3️⃣ Lấy các lịch hẹn của bác sĩ trong ngày
            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate);

            // 4️⃣ Map sang DTO
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            // 1. Lấy Doctor tương ứng với UserId
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user.");

            // 2. Lấy các lịch hẹn của bác sĩ trong khoảng thời gian đã cho
            //    Thêm 1 ngày vào endDate để bao gồm tất cả các cuộc hẹn trong ngày cuối cùng.
            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate.AddDays(1));

            // 3. Map sang DTO
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<bool> IsDoctorBusyAsync(Guid doctorId, DateTime appointmentStartTime, DateTime appointmentEndTime)
        {
            // Lấy tất cả lịch hẹn của bác sĩ trong khoảng thời gian này
            var conflictingAppointments = await GetConflictingAppointmentsAsync(doctorId, appointmentStartTime, appointmentEndTime);

            // Nếu có bất kỳ lịch hẹn nào trùng thì bác sĩ đang bận
            return conflictingAppointments.Any();
        }


        public async Task<List<AppointmentDto>> GetConflictingAppointmentsAsync(
            Guid doctorId,
            DateTime appointmentStartTime,
            DateTime appointmentEndTime)
        {
            // Lấy tất cả lịch hẹn của bác sĩ
            var allAppointments = await _repository.GetByDoctorAsync(doctorId);

       var conflictingAppointments = allAppointments.Where(a =>
    // ✅ Chỉ kiểm tra các lịch hẹn CHƯA bị hủy hoặc hoàn thành
    a.StatusCode == "OnProgressing" &&
  // ✅ Kiểm tra trùng thời gian (overlap)
  appointmentStartTime < a.AppointmentEndTime &&
        appointmentEndTime > a.AppointmentStartTime
).ToList();

            return _mapper.Map<List<AppointmentDto>>(conflictingAppointments);
        }
    }
}
