using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IMedicationRepository
    {
        Task<IEnumerable<MedicationDatabase>> GetAllAsync();
        Task<IEnumerable<MedicationDatabase>> GetAllIncludingInactiveAsync();
        Task<MedicationDatabase?> GetByIdAsync(Guid id);
        Task<IEnumerable<MedicationDatabase>> SearchAsync(string query, int limit = 10);
        Task<MedicationDatabase> CreateAsync(MedicationDatabase medication);
        Task<MedicationDatabase> UpdateAsync(MedicationDatabase medication);
    }
}
