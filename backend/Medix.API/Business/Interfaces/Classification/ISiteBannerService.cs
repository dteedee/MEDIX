using Medix.API.Models.DTOs.SiteBanner;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ISiteBannerService
    {
        Task<(int total, IEnumerable<SiteBannerDto> data)> GetPagedAsync(int page = 1, int pageSize = 10);

        Task<(int total, IEnumerable<SiteBannerDto> data)> GetActivePagedAsync(int page = 1, int pageSize = 10);

        Task<SiteBannerDto?> GetByIdAsync(Guid id);

        Task<IEnumerable<SiteBannerDto>> GetActiveBannersAsync(int? limit = null);

        Task<SiteBannerDto> CreateAsync(SiteBannerCreateDto createDto);

        Task<SiteBannerDto> UpdateAsync(Guid id, SiteBannerUpdateDto updateDto);

        Task<bool> DeleteAsync(Guid id);

        Task UpdateDisplayOrderAsync(Guid id, int displayOrder);

        Task ToggleActiveStatusAsync(Guid id, bool isActive);
    }
}
