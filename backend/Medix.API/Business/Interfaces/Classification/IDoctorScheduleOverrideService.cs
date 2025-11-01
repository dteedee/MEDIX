﻿using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorScheduleOverrideService
    {
        Task<List<DoctorScheduleOverrideDto>> GetByDoctorAsync(Guid doctorId);
        Task<DoctorScheduleOverrideDto?> GetByIdAsync(Guid id);
        Task<DoctorScheduleOverrideDto> CreateAsync(CreateDoctorScheduleOverrideDto dto);
        Task<DoctorScheduleOverrideDto> UpdateAsync(Guid id, UpdateDoctorScheduleOverrideDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorAsync(Guid doctorId, List<UpdateDoctorScheduleOverrideDto> dtos);
        Task<DoctorScheduleOverrideDto> CreateByDoctorUserAsync(CreateDoctorScheduleOverrideDto dto, Guid userId);
        Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorUserAsync(List<UpdateDoctorScheduleOverrideDto> dtos, Guid userId);
        Task<bool> DeleteByDoctorUserAsync(Guid overrideId, Guid userId);
        Task<List<DoctorScheduleOverrideDto>> GetByDoctorUserAsync(Guid userId);
    }
}
