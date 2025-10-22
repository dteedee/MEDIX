using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorScheduleService
    {
        Task<IEnumerable<DoctorScheduleDto>> GetAllAsync();
        Task<DoctorScheduleDto?> GetByIdAsync(Guid id);
        Task<DoctorScheduleDto> CreateAsync(CreateDoctorScheduleDto dto);
        Task<DoctorScheduleDto?> UpdateAsync(UpdateDoctorScheduleDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
