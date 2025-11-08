﻿using Medix.API.Models.DTOs.ApointmentDTO;

namespace Medix.API.Business.Interfaces.Classification

{
    public interface IAppointmentService
    {
        Task<IEnumerable<AppointmentDto>> GetAllAsync();
        Task<AppointmentDto?> GetByIdAsync(Guid id);
        Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto);
        Task<AppointmentDto?> UpdateAsync(UpdateAppointmentDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<AppointmentDto>> GetByDoctorAsync(Guid doctorId);
        Task<IEnumerable<AppointmentDto>> GetByPatientAsync(Guid patientId);
        Task<IEnumerable<AppointmentDto>> GetByDateAsync(DateTime date);
        Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateAsync(Guid userId, DateTime date);
        Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
        Task<bool> IsDoctorBusyAsync(Guid doctorId, DateTime appointmentStartTime, DateTime appointmentEndTime);

       
    }
}