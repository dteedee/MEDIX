using AutoMapper;
using Medix.API.Application.Exceptions;
using Medix.API.Data;
using Medix.API.Data.Models;
using Medix.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Application.Services
{
    public class SiteBannerService : ISiteBannerService
    {
        private readonly MedixContext _context;
        private readonly IMapper _mapper;

        public SiteBannerService(MedixContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<(int total, IEnumerable<SiteBanner> data)> GetAllAsync(int page = 1, int pageSize = 10)
        {
            var query = _context.SiteBanners
                .OrderBy(b => b.DisplayOrder)
                .AsQueryable();

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (total, data);
        }

        public async Task<IEnumerable<SiteBanner>> GetByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Name", new[] { "Vui lòng nhập tên banner" } }
                });
            }

            var banners = await _context.SiteBanners
                .Where(b => b.BannerTitle.Contains(name))
                .ToListAsync();

            return banners;
        }

        public async Task<SiteBanner> CreateAsync(SiteBannerCreateDto createDto)
        {
            var banner = new SiteBanner
            {
                Id = Guid.NewGuid(),
                BannerTitle = createDto.BannerTitle,
                BannerImageUrl = createDto.BannerImageUrl,
                BannerUrl = createDto.BannerUrl,
                DisplayOrder = createDto.DisplayOrder,
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                IsActive = createDto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.SiteBanners.Add(banner);
            await _context.SaveChangesAsync();

            return banner;
        }

        public async Task<SiteBanner> UpdateAsync(Guid id, SiteBannerUpdateDto updateDto)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner == null)
            {
                throw new NotFoundException("Không tìm thấy banner");
            }

            banner.BannerTitle = updateDto.BannerTitle;
            banner.BannerImageUrl = updateDto.BannerImageUrl;
            banner.BannerUrl = updateDto.BannerUrl;
            banner.DisplayOrder = updateDto.DisplayOrder;
            banner.StartDate = updateDto.StartDate;
            banner.EndDate = updateDto.EndDate;
            banner.IsActive = updateDto.IsActive;

            await _context.SaveChangesAsync();

            return banner;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner == null)
            {
                throw new NotFoundException("Không tìm thấy banner");
            }

            _context.SiteBanners.Remove(banner);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
