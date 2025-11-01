using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IServiceTierRepository
    {
        Task<IEnumerable<DoctorServiceTier>> GetActiveTiersAsync();
    }
}
