using Medix.API.Models.DTOs.MedicationDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IMedicationService
    {
        Task<IEnumerable<MedicationDto>> GetAllAsync();
        Task<MedicationDto?> GetByIdAsync(Guid id);
    }
}
