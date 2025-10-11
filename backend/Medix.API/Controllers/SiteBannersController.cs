using Medix.API.DTOs;
using Medix.API.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Medix.API.Data;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteBannerController : ControllerBase
    {
        private readonly MedixContext _context;

        public SiteBannerController(MedixContext context)
        {
            _context = context;
        }

        // GET: api/SiteBanner?page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.SiteBanners
                .OrderBy(b => b.DisplayOrder)
                .AsQueryable();

            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                data = items
            });
        }

        // GET: api/SiteBanner/by-name?name=Health
        [HttpGet("by-name")]
        public async Task<IActionResult> GetByName([FromQuery] string name)
        {
            var banners = await _context.SiteBanners
                .Where(b => b.BannerTitle.Contains(name))
                .ToListAsync();

            if (!banners.Any())
                return NotFound($"Không tìm thấy banner nào có tên chứa '{name}'.");

            return Ok(banners);
        }

        // POST: api/SiteBanner
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SiteBannerCreateDto dto)
        {
            var banner = new SiteBanner
            {
                Id = Guid.NewGuid(), // 👈 Tự sinh Guid
                BannerTitle = dto.BannerTitle,
                BannerImageUrl = dto.BannerImageUrl,
                BannerUrl = dto.BannerUrl,
                DisplayOrder = dto.DisplayOrder,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.SiteBanners.Add(banner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByName), new { name = banner.BannerTitle }, banner);
        }

        // PUT: api/SiteBanner/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] SiteBannerUpdateDto dto)
        {
            var existing = await _context.SiteBanners.FindAsync(id);
            if (existing == null)
                return NotFound("Không tìm thấy banner.");

            existing.BannerTitle = dto.BannerTitle;
            existing.BannerImageUrl = dto.BannerImageUrl;
            existing.BannerUrl = dto.BannerUrl;
            existing.DisplayOrder = dto.DisplayOrder;
            existing.StartDate = dto.StartDate;
            existing.EndDate = dto.EndDate;
            existing.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/SiteBanner/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var banner = await _context.SiteBanners.FindAsync(id);
            if (banner == null)
                return NotFound("Không tìm thấy banner.");

            _context.SiteBanners.Remove(banner);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
