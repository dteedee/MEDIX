using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ISiteBannerRepository
    {
        Task<(IEnumerable<SiteBanner> Banners, int TotalCount)> GetPagedAsync(int page, int pageSize);

        Task<(IEnumerable<SiteBanner> Banners, int TotalCount)> GetActivePagedAsync(int page, int pageSize);

        Task<SiteBanner?> GetByIdAsync(Guid id);

        Task<IEnumerable<SiteBanner>> GetActiveBannersAsync(int? limit = null);

        Task<SiteBanner> CreateAsync(SiteBanner banner);

        Task<SiteBanner> UpdateAsync(SiteBanner banner);

        Task<bool> DeleteAsync(Guid id);

        Task UpdateDisplayOrderAsync(Guid id, int displayOrder);

        Task ToggleActiveStatusAsync(Guid id, bool isActive);
    }
}
