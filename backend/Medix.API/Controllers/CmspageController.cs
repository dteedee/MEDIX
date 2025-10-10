using Medix.API.Data.Models;
using Medix.API.DTOs;
using Medix.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CmspageController : ControllerBase
    {
        private readonly MedixContext _context;

        public CmspageController(MedixContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var pages = await _context.Cmspages
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new CmspageDto
                {
                    Id = p.Id,
                    PageTitle = p.PageTitle,
                    PageSlug = p.PageSlug,
                    PageContent = p.PageContent,
                    MetaTitle = p.MetaTitle,
                    MetaDescription = p.MetaDescription,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    AuthorName = p.Author.FullName,
                    ViewCount = p.ViewCount,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(pages);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var page = await _context.Cmspages
                .Include(p => p.Author)
                .Where(p => p.Id == id)
                .Select(p => new CmspageDto
                {
                    Id = p.Id,
                    PageTitle = p.PageTitle,
                    PageSlug = p.PageSlug,
                    PageContent = p.PageContent,
                    MetaTitle = p.MetaTitle,
                    MetaDescription = p.MetaDescription,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    AuthorName = p.Author.FullName,
                    ViewCount = p.ViewCount,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (page == null)
                return NotFound("Không tìm thấy trang.");

            return Ok(page);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CmspageCreateDto dto)
        {
            var slugExists = await _context.Cmspages.AnyAsync(p => p.PageSlug == dto.PageSlug);
            if (slugExists)
                return Conflict("PageSlug đã tồn tại.");

            var authorExists = await _context.Users.AnyAsync(u => u.Id == dto.AuthorId);
            if (!authorExists)
                return BadRequest("AuthorId không hợp lệ.");

            var page = new Cmspage
            {
                Id = Guid.NewGuid(),
                PageTitle = dto.PageTitle,
                PageSlug = dto.PageSlug,
                PageContent = dto.PageContent,
                MetaTitle = dto.MetaTitle,
                MetaDescription = dto.MetaDescription,
                IsPublished = dto.IsPublished,
                PublishedAt = dto.PublishedAt,
                AuthorId = dto.AuthorId,
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Cmspages.Add(page);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = page.Id }, new { page.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CmspageUpdateDto dto)
        {
            var page = await _context.Cmspages.FindAsync(id);
            if (page == null)
                return NotFound("Không tìm thấy trang.");

            var slugExists = await _context.Cmspages
                .AnyAsync(p => p.PageSlug == dto.PageSlug && p.Id != id);
            if (slugExists)
                return Conflict("PageSlug đã tồn tại.");

            var authorExists = await _context.Users.AnyAsync(u => u.Id == dto.AuthorId);
            if (!authorExists)
                return BadRequest("AuthorId không hợp lệ.");

            page.PageTitle = dto.PageTitle;
            page.PageSlug = dto.PageSlug;
            page.PageContent = dto.PageContent;
            page.MetaTitle = dto.MetaTitle;
            page.MetaDescription = dto.MetaDescription;
            page.IsPublished = dto.IsPublished;
            page.PublishedAt = dto.PublishedAt;
            page.AuthorId = dto.AuthorId;
            page.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thành công", page.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var page = await _context.Cmspages.FindAsync(id);
            if (page == null)
                return NotFound("Không tìm thấy trang.");

            _context.Cmspages.Remove(page);
            await _context.SaveChangesAsync();

            return Ok("Đã xóa trang thành công.");
        }
    }

}
