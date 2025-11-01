using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorScheduleRepository
    {
        public Task<List<DoctorSchedule>> GetDoctorSchedulesByDoctorIdAsync(Guid doctorId);
        Task<IEnumerable<DoctorSchedule>> GetAllAsync();
        Task<DoctorSchedule?> GetByIdAsync(Guid id);
        Task AddAsync(DoctorSchedule schedule);
        Task UpdateAsync(DoctorSchedule schedule);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<DoctorSchedule>> GetByDoctorAndDayAsync(Guid doctorId, int dayOfWeek);
        Task<IDbContextTransaction> BeginTransactionAsync();

    }
}
