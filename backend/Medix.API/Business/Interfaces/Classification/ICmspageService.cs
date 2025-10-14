using Medix.API.Models.DTOs.CMSPage;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ICmspageService
    {
        Task<IEnumerable<CmspageDto>> GetAllAsync();
        Task<CmspageDto?> GetByIdAsync(Guid id);
        Task<CmspageDto> CreateAsync(CmspageCreateDto createDto);
        Task<CmspageDto> UpdateAsync(Guid id, CmspageUpdateDto updateDto);
        Task<bool> DeleteAsync(Guid id);
    }
}
