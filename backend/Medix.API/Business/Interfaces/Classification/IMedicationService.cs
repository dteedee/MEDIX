using Medix.API.Models.DTOs.MedicationDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IMedicationService
    {
        Task<IEnumerable<MedicationDto>> GetAllAsync();
        Task<IEnumerable<MedicationDto>> GetAllIncludingInactiveAsync();
        Task<MedicationDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<MedicationSearchDto>> SearchAsync(string query);
        Task<MedicationDto> CreateAsync(MedicationCreateDto dto);
        Task<MedicationDto> UpdateAsync(Guid id, MedicationUpdateDto dto);
        Task<bool> ToggleActiveAsync(Guid id);
    }
}
