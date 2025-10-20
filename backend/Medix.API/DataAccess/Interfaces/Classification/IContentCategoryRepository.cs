using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IContentCategoryRepository
    {
        Task<(IEnumerable<ContentCategory> Categories, int TotalCount)> GetPagedAsync(int page, int pageSize);

        Task<IEnumerable<ContentCategory>> GetAllActiveAsync();

        Task<ContentCategory?> GetByIdWithParentAsync(Guid id);

        Task<ContentCategory?> GetBySlugAsync(string slug);

        Task<bool> NameExistsAsync(string name, Guid? excludeId = null);

        Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null);

        Task<ContentCategory> CreateAsync(ContentCategory category);

        Task<ContentCategory> UpdateAsync(ContentCategory category);

        Task<bool> DeleteAsync(Guid id);

        Task<bool> HasChildrenAsync(Guid categoryId);
    }
}
