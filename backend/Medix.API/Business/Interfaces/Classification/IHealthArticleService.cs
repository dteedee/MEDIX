using Medix.API.Models.DTOs.HealthArticle;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IHealthArticleService
    {
        Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPagedAsync(int page = 1, int pageSize = 10);

        Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPublishedPagedAsync(int page = 1, int pageSize = 10);

        Task<HealthArticlePublicDto?> GetByIdAsync(Guid id);

        Task<HealthArticlePublicDto?> GetBySlugAsync(string slug);

        Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetByCategoryAsync(Guid categoryId, int page = 1, int pageSize = 10);

        Task<IEnumerable<HealthArticlePublicDto>> SearchByNameAsync(string name);

        Task<IEnumerable<HealthArticlePublicDto>> GetHomepageArticlesAsync(int limit = 5);

        Task<HealthArticlePublicDto> CreateAsync(HealthArticleCreateDto createDto);

        Task<HealthArticlePublicDto> UpdateAsync(Guid id, HealthArticleUpdateDto updateDto);

        Task<bool> DeleteAsync(Guid id);
        Task<HealthArticlePublicDto?> LikeAsync(Guid id, Guid userId);

        Task<HealthArticlePublicDto?> UnlikeAsync(Guid id, Guid userId);

        Task IncrementViewCountOnlyAsync(Guid articleId);
    }
}
