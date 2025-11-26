using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IServiceTierRepository
    {
        Task<IEnumerable<DoctorServiceTier>> GetActiveTiersAsync();
        Task<DoctorServiceTier?> GetServiceTierByNameAsync(string name);
        Task<DoctorServiceTier?> GetByIdAsync(Guid id);
        Task<List<DoctorServiceTier>> GetAllAsync();
        Task UpdateAsync(DoctorServiceTier tier);

    }
}
