using Medix.API.DTOs;

namespace Medix.API.Application.Services
{
    public interface IHealthArticleService
    {
        Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetAllAsync(int page = 1, int pageSize = 10);
        Task<HealthArticlePublicDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<HealthArticlePublicDto>> SearchAsync(string keyword);
        Task<HealthArticlePublicDto> CreateAsync(HealthArticleCreateDto createDto);
        Task<HealthArticleUpdateDto> GetForEditAsync(Guid id);
        Task<HealthArticlePublicDto> UpdateAsync(Guid id, HealthArticleUpdateDto updateDto);
        Task<bool> DeleteAsync(Guid id);
    }
}
