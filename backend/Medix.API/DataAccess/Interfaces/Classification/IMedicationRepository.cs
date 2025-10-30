using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IMedicationRepository
    {
        Task<IEnumerable<MedicationDatabase>> GetAllAsync();
        Task<MedicationDatabase?> GetByIdAsync(Guid id);
    }
}
