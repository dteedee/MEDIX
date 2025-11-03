using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorScheduleService
    {
        Task<IEnumerable<DoctorScheduleWorkDto>> GetAllAsync();
        Task<DoctorScheduleWorkDto?> GetByIdAsync(Guid id);
        Task<DoctorScheduleWorkDto> CreateAsync(CreateDoctorScheduleDto dto);
        Task<DoctorScheduleWorkDto?> UpdateAsync(UpdateDoctorScheduleDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<DoctorScheduleWorkDto>> GetByDoctorIdAsync(Guid doctorId);
        //Task<IEnumerable<DoctorScheduleDto>> UpdateByDoctorIdAsync(Guid doctorId, IEnumerable<UpdateDoctorScheduleDto> schedules);
        Task<IEnumerable<DoctorScheduleWorkDto>> CreateByDoctorIdAsync(Guid doctorId, IEnumerable<CreateDoctorScheduleDto> schedules);
        Task<int> DeleteByDoctorIdAsync(Guid doctorId, IEnumerable<Guid> scheduleIds);

        Task<DoctorScheduleWorkDto?> UpdateSingleByDoctorIdAsync(Guid doctorId, UpdateDoctorScheduleDto schedule);
    }
}
