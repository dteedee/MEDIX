using Medix.API.DTOs;

namespace Medix.API.Application.Services
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
