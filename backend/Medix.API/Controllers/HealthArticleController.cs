using Medix.API.DTOs;
using Medix.API.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Medix.API.Data;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthArticleController : ControllerBase
    {
        private readonly MedixContext _context;

        public HealthArticleController(MedixContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.PublishedAt)
                .AsQueryable();

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var article = await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .Where(a => a.Id == id)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (article == null)
                return NotFound("Không tìm thấy bài viết.");

            return Ok(article);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Vui lòng nhập từ khóa tìm kiếm.");

            var data = await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .Where(a => a.Title.Contains(keyword) || (a.Summary ?? "").Contains(keyword))
                .OrderByDescending(a => a.PublishedAt)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new { total = data.Count, data });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HealthArticleCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var slugExists = await _context.HealthArticles.AnyAsync(a => a.Slug == dto.Slug);
            if (slugExists)
                return Conflict("Slug đã tồn tại. Vui lòng chọn slug khác.");

            var statusExists = await _context.RefArticleStatuses.AnyAsync(s => s.Code == dto.StatusCode);
            if (!statusExists)
                return BadRequest("StatusCode không hợp lệ.");

            var article = new HealthArticle
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Slug = dto.Slug,
                Summary = dto.Summary,
                Content = dto.Content,
                DisplayType = dto.DisplayType,
                ThumbnailUrl = dto.ThumbnailUrl,
                CoverImageUrl = dto.CoverImageUrl,
                IsHomepageVisible = dto.IsHomepageVisible,
                DisplayOrder = dto.DisplayOrder,
                MetaTitle = dto.MetaTitle,
                MetaDescription = dto.MetaDescription,
                AuthorId = dto.AuthorId,
                StatusCode = dto.StatusCode,
                PublishedAt = dto.PublishedAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HealthArticles.Add(article);
            await _context.SaveChangesAsync();

            var categories = await _context.ContentCategories
                .Where(c => dto.CategoryIds.Contains(c.Id))
                .ToListAsync();

            article.Categories = categories;
            await _context.SaveChangesAsync();

            var result = new HealthArticlePublicDto
            {
                Id = article.Id,
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                ThumbnailUrl = article.ThumbnailUrl,
                CoverImageUrl = article.CoverImageUrl,
                AuthorName = (await _context.Users.FindAsync(article.AuthorId))?.FullName ?? "Unknown",
                PublishedAt = article.PublishedAt,
                ViewCount = article.ViewCount,
                LikeCount = article.LikeCount,
                Categories = categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                {
                    Name = c.Name,
                    Slug = c.Slug
                }).ToList()
            };

            return CreatedAtAction(nameof(GetById), new { id = article.Id }, result);
        }
        [HttpGet("{id}/edit")]
        public async Task<IActionResult> GetForEdit(Guid id)
        {
            var article = await _context.HealthArticles
                .Include(a => a.Categories)
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
                return NotFound("Không tìm thấy bài viết.");

            var dto = new HealthArticleUpdateDto
            {
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                DisplayType = article.DisplayType,
                ThumbnailUrl = article.ThumbnailUrl,
                CoverImageUrl = article.CoverImageUrl,
                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                MetaTitle = article.MetaTitle,
                MetaDescription = article.MetaDescription,
                AuthorId = article.AuthorId,
                StatusCode = article.StatusCode,
                PublishedAt = article.PublishedAt,
                CategoryIds = article.Categories.Select(c => c.Id).ToList()
            };

            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] HealthArticleUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var article = await _context.HealthArticles
                .Include(a => a.Categories)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
                return NotFound("Không tìm thấy bài viết để cập nhật.");

            var slugExists = await _context.HealthArticles
                .AnyAsync(a => a.Slug == dto.Slug && a.Id != id);
            if (slugExists)
                return Conflict("Slug đã tồn tại. Vui lòng chọn slug khác.");

            var authorExists = await _context.Users.AnyAsync(u => u.Id == dto.AuthorId);
            if (!authorExists)
                return BadRequest("AuthorId không hợp lệ.");

            var statusExists = await _context.RefArticleStatuses.AnyAsync(s => s.Code == dto.StatusCode);
            if (!statusExists)
                return BadRequest("StatusCode không hợp lệ.");

            article.Title = dto.Title;
            article.Slug = dto.Slug;
            article.Summary = dto.Summary;
            article.Content = dto.Content;
            article.DisplayType = dto.DisplayType;
            article.ThumbnailUrl = dto.ThumbnailUrl;
            article.CoverImageUrl = dto.CoverImageUrl;
            article.IsHomepageVisible = dto.IsHomepageVisible;
            article.DisplayOrder = dto.DisplayOrder;
            article.MetaTitle = dto.MetaTitle;
            article.MetaDescription = dto.MetaDescription;
            article.AuthorId = dto.AuthorId;
            article.StatusCode = dto.StatusCode;
            article.PublishedAt = dto.PublishedAt;
            article.UpdatedAt = DateTime.UtcNow;

            article.Categories.Clear();
            article.Categories = await _context.ContentCategories
                .Where(c => dto.CategoryIds.Contains(c.Id))
                .ToListAsync();

            await _context.SaveChangesAsync();

            return Ok("Cập nhật bài viết thành công.");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var article = await _context.HealthArticles.FindAsync(id);
            if (article == null)
                return NotFound("Không tìm thấy bài viết để xóa.");

            _context.HealthArticles.Remove(article);
            await _context.SaveChangesAsync();

            return Ok("Đã xóa bài viết thành công.");
        }

    }
}
