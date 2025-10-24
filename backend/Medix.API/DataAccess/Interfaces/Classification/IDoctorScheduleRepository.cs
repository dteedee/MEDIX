using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorScheduleRepository
    {
        Task<IEnumerable<DoctorSchedule>> GetAllAsync();
        Task<DoctorSchedule?> GetByIdAsync(Guid id);
        Task AddAsync(DoctorSchedule schedule);
        Task UpdateAsync(DoctorSchedule schedule);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<DoctorSchedule>> GetByDoctorAndDayAsync(Guid doctorId, int dayOfWeek);

    }
}
