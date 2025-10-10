using Medix.API.DTOs;
using Medix.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContentCategoryController : ControllerBase
    {
        private readonly MedixContext _context;

        public ContentCategoryController(MedixContext context)
        {
            _context = context;
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.ContentCategories
                .Include(c => c.Parent)
                .OrderBy(c => c.Name)
                .AsQueryable();

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new ContentCategoryDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    ParentId = c.ParentId,
                    ParentName = c.Parent != null ? c.Parent.Name : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data });
        }

        // GET: api/ContentCategory/search?keyword=health
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Vui lòng nhập từ khóa tìm kiếm.");

            var data = await _context.ContentCategories
                .Include(c => c.Parent)
                .Where(c => c.Name.Contains(keyword))
                .OrderBy(c => c.Name)
                .Select(c => new ContentCategoryDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    ParentId = c.ParentId,
                    ParentName = c.Parent != null ? c.Parent.Name : null
                })
                .ToListAsync();

            return Ok(new { total = data.Count, data });
        }

        // GET: api/ContentCategory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var category = await _context.ContentCategories
                .Include(c => c.Parent)
                .Select(c => new ContentCategoryDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    ParentId = c.ParentId,
                    ParentName = c.Parent != null ? c.Parent.Name : null
                })
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound("Không tìm thấy danh mục.");

            return Ok(category);
        }

        // POST: api/ContentCategory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ContentCategoryCreateDto dto)
        {
            // Kiểm tra Slug trùng
            var slugExists = await _context.ContentCategories.AnyAsync(c => c.Slug == dto.Slug);
            if (slugExists)
                return Conflict("Slug đã tồn tại. Vui lòng chọn slug khác.");

            // Kiểm tra ParentId hợp lệ
            if (dto.ParentId.HasValue)
            {
                var parentExists = await _context.ContentCategories.AnyAsync(c => c.Id == dto.ParentId);
                if (!parentExists)
                    return BadRequest("ParentId không hợp lệ.");
            }

            var category = new ContentCategory
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Slug = dto.Slug,
                Description = dto.Description,
                ParentId = dto.ParentId,
                IsActive = dto.IsActive
            };

            _context.ContentCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = category.Id }, new { category.Id });
        }

        // PUT: api/ContentCategory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ContentCategoryUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = await _context.ContentCategories.FindAsync(id);
            if (category == null)
                return NotFound("Không tìm thấy danh mục.");

            // Kiểm tra Slug trùng với danh mục khác
            var slugExists = await _context.ContentCategories
                .AnyAsync(c => c.Slug == dto.Slug && c.Id != id);
            if (slugExists)
                return Conflict("Slug đã tồn tại. Vui lòng chọn slug khác.");

            // Kiểm tra ParentId không trùng chính nó
            if (dto.ParentId == id)
                return BadRequest("ParentId không thể trùng với chính danh mục.");

            // Kiểm tra ParentId có tồn tại (nếu có)
            if (dto.ParentId.HasValue)
            {
                var parentExists = await _context.ContentCategories.AnyAsync(c => c.Id == dto.ParentId);
                if (!parentExists)
                    return BadRequest("ParentId không hợp lệ.");
            }

            // Cập nhật dữ liệu
            category.Name = dto.Name;
            category.Slug = dto.Slug;
            category.Description = dto.Description;
            category.ParentId = dto.ParentId;
            category.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật danh mục thành công.",
                categoryId = category.Id
            });
        }

        // DELETE: api/ContentCategory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var category = await _context.ContentCategories.FindAsync(id);
            if (category == null)
                return NotFound("Không tìm thấy danh mục.");

            // Kiểm tra xem có danh mục con không
            var hasChildren = await _context.ContentCategories.AnyAsync(c => c.ParentId == id);
            if (hasChildren)
                return BadRequest("Không thể xóa danh mục vì có danh mục con.");

            _context.ContentCategories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok("Đã xóa danh mục thành công.");
        }
    }

}
