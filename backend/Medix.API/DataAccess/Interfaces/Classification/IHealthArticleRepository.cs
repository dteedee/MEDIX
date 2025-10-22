using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IHealthArticleRepository
    {
        Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetPagedAsync(int page, int pageSize);

        Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetPublishedPagedAsync(int page, int pageSize);

        Task<HealthArticle?> GetByIdWithDetailsAsync(Guid id);

        Task<HealthArticle?> GetBySlugAsync(string slug);

        Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetByCategoryAsync(Guid categoryId, int page, int pageSize);

        Task<IEnumerable<HealthArticle>> SearchByNameAsync(string name);

        Task<IEnumerable<HealthArticle>> GetHomepageArticlesAsync(int limit);

        Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null);

        Task<bool> TitleExistsAsync(string title, Guid? excludeId = null);

        Task<HealthArticle> CreateAsync(HealthArticle article);

        Task<HealthArticle> UpdateAsync(HealthArticle article);

        Task<bool> DeleteAsync(Guid id);

        Task IncrementViewCountAsync(Guid id);

        Task<bool> UserExistsAsync(Guid userId);
        Task IncrementLikeCountAsync(Guid id);

        Task<bool> HasUserLikedAsync(Guid articleId, Guid userId);

        Task AddLikeAsync(Guid articleId, Guid userId);

        Task RemoveLikeAsync(Guid articleId, Guid userId);
    }
}
