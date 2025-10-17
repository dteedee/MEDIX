using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ICmspageRepository
    {
        Task<IEnumerable<Cmspage>> GetAllWithAuthorAsync();

        Task<Cmspage?> GetByIdWithAuthorAsync(Guid id);

        Task<Cmspage?> GetBySlugAsync(string slug);

        Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null);

        Task<Cmspage> CreateAsync(Cmspage page);

        Task<Cmspage> UpdateAsync(Cmspage page);

        Task<bool> DeleteAsync(Guid id);

        Task<bool> UserExistsAsync(Guid userId);

        Task<(IEnumerable<Cmspage> Pages, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<IEnumerable<Cmspage>> SearchByNameAsync(string name);
    }
}
