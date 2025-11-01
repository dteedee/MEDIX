using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorScheduleOverrideRepository
    {
        Task<List<DoctorScheduleOverride>> GetByDoctorIdAsync(Guid doctorId);
        Task<DoctorScheduleOverride?> GetByIdAsync(Guid id);
        Task AddAsync(DoctorScheduleOverride entity);
        Task UpdateAsync(DoctorScheduleOverride entity);
        Task DeleteAsync(DoctorScheduleOverride entity);
        Task SaveChangesAsync();
        Task<Guid?> GetDoctorIdByUserIdAsync(Guid userId);

    }
}
