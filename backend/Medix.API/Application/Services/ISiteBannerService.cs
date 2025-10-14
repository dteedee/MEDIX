using Medix.API.Data.Models;
using Medix.API.DTOs;

namespace Medix.API.Application.Services
{
    public interface ISiteBannerService
    {
        Task<(int total, IEnumerable<SiteBanner> data)> GetAllAsync(int page = 1, int pageSize = 10);
        Task<IEnumerable<SiteBanner>> GetByNameAsync(string name);
        Task<SiteBanner> CreateAsync(SiteBannerCreateDto createDto);
        Task<SiteBanner> UpdateAsync(Guid id, SiteBannerUpdateDto updateDto);
        Task<bool> DeleteAsync(Guid id);
    }
}
