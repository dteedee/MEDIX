using Microsoft.EntityFrameworkCore;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class SiteBannerRepository : ISiteBannerRepository
    {
        private readonly MedixContext _context;

        public SiteBannerRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<SiteBanner> Banners, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.SiteBanners
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt);

            var totalCount = await query.CountAsync();
            var banners = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (banners, totalCount);
        }

        public async Task<(IEnumerable<SiteBanner> Banners, int TotalCount)> GetActivePagedAsync(int page, int pageSize)
        {
            var query = _context.SiteBanners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt);

            var totalCount = await query.CountAsync();
            var banners = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (banners, totalCount);
        }

        public async Task<SiteBanner?> GetByIdAsync(Guid id)
        {
            return await _context.SiteBanners
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<IEnumerable<SiteBanner>> GetActiveBannersAsync(int? limit = null)
        {
            var query = _context.SiteBanners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt);

            if (limit.HasValue)
                query = (IOrderedQueryable<SiteBanner>)query.Take(limit.Value);

            return await query.ToListAsync();
        }

        public async Task<SiteBanner> CreateAsync(SiteBanner banner)
        {
            _context.SiteBanners.Add(banner);
            await _context.SaveChangesAsync();
            return banner;
        }

        public async Task<SiteBanner> UpdateAsync(SiteBanner banner)
        {
            _context.SiteBanners.Update(banner);
            await _context.SaveChangesAsync();
            return banner;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner == null)
                return false;

            _context.SiteBanners.Remove(banner);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task UpdateDisplayOrderAsync(Guid id, int displayOrder)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner != null)
            {
                banner.DisplayOrder = displayOrder;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ToggleActiveStatusAsync(Guid id, bool isActive)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner != null)
            {
                banner.IsActive = isActive;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<SiteBanner>> GetRunningBannersAsync()
        {
            var today = DateTime.UtcNow.Date;
            return await _context.SiteBanners
                .Where(b => b.IsActive && b.StartDate <= today && today <= b.EndDate)
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt) 
                .ToListAsync();
        }

        public async Task<(IEnumerable<SiteBanner> Banners, int TotalCount)> SearchByNameAsync(string name, int page, int pageSize)
        {
            var query = _context.SiteBanners
                .Where(b => EF.Functions.Like(b.BannerTitle, $"%{name}%"))
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt);

            var totalCount = await query.CountAsync();
            var banners = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (banners, totalCount);
        }

        public async Task IncrementDisplayOrderForConflictsAsync(int displayOrder, Guid? excludeId = null)
        {
            var query = _context.SiteBanners
                .Where(b => b.DisplayOrder >= displayOrder);

            if (excludeId.HasValue)
            {
                query = query.Where(b => b.Id != excludeId.Value);
            }

            var conflictingBanners = await query.ToListAsync();
            foreach (var banner in conflictingBanners)
            {
                banner.DisplayOrder += 1;
            }

            // Lưu ngay các thay đổi để đảm bảo không có conflict khi tạo banner mới
            if (conflictingBanners.Any())
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}
