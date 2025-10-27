using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IPrescriptionRepository
    {
        Task<IEnumerable<Prescription>> GetByMedicalRecordIdAsync(Guid medicalRecordId);
        Task<Prescription?> GetByIdAsync(Guid id);
        Task AddAsync(Prescription entity);
        Task UpdateAsync(Prescription entity);
        Task DeleteAsync(Guid id);
    }
}
