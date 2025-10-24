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
        Task<IEnumerable<DoctorScheduleDto>> GetByDoctorIdAsync(Guid doctorId);
        //Task<IEnumerable<DoctorScheduleDto>> UpdateByDoctorIdAsync(Guid doctorId, IEnumerable<UpdateDoctorScheduleDto> schedules);
        Task<IEnumerable<DoctorScheduleDto>> CreateByDoctorIdAsync(Guid doctorId, IEnumerable<CreateDoctorScheduleDto> schedules);
        Task<int> DeleteByDoctorIdAsync(Guid doctorId, IEnumerable<Guid> scheduleIds);

        Task<DoctorScheduleDto?> UpdateSingleByDoctorIdAsync(Guid doctorId, UpdateDoctorScheduleDto schedule);
    }
}
