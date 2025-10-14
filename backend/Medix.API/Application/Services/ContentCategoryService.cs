using AutoMapper;
using Medix.API.Application.Exceptions;
using Medix.API.Data;
using Medix.API.Data.Models;
using Medix.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Application.Services
{
    public class ContentCategoryService : IContentCategoryService
    {
        private readonly MedixContext _context;
        private readonly IMapper _mapper;

        public ContentCategoryService(MedixContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<(int total, IEnumerable<ContentCategoryDTO> data)> GetPagedAsync(int page = 1, int pageSize = 10)
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

            return (total, data);
        }

        public async Task<IEnumerable<ContentCategoryDTO>> SearchAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Keyword", new[] { "Vui lòng nhập từ khóa tìm kiếm" } }
                });
            }

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

            return data;
        }

        public async Task<ContentCategoryDTO?> GetByIdAsync(Guid id)
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

            return category;
        }

        public async Task<ContentCategoryDTO> CreateAsync(ContentCategoryCreateDto createDto)
        {
            var slugExists = await _context.ContentCategories.AnyAsync(c => c.Slug == createDto.Slug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug đã tồn tại. Vui lòng chọn slug khác" } }
                });
            }

            if (createDto.ParentId.HasValue)
            {
                var parentExists = await _context.ContentCategories.AnyAsync(c => c.Id == createDto.ParentId);
                if (!parentExists)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "ParentId", new[] { "ParentId không hợp lệ" } }
                    });
                }
            }

            var category = new ContentCategory
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Slug = createDto.Slug,
                Description = createDto.Description,
                ParentId = createDto.ParentId,
                IsActive = createDto.IsActive
            };

            _context.ContentCategories.Add(category);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(category.Id) ?? throw new MedixException("Failed to retrieve created category");
        }

        public async Task<ContentCategoryDTO> UpdateAsync(Guid id, ContentCategoryUpdateDto updateDto)
        {
            var category = await _context.ContentCategories.FindAsync(id);
            if (category == null)
            {
                throw new NotFoundException("Không tìm thấy danh mục");
            }

            var slugExists = await _context.ContentCategories
                .AnyAsync(c => c.Slug == updateDto.Slug && c.Id != id);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug đã tồn tại. Vui lòng chọn slug khác" } }
                });
            }

            if (updateDto.ParentId == id)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "ParentId", new[] { "ParentId không thể trùng với chính danh mục" } }
                });
            }

            if (updateDto.ParentId.HasValue)
            {
                var parentExists = await _context.ContentCategories.AnyAsync(c => c.Id == updateDto.ParentId);
                if (!parentExists)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "ParentId", new[] { "ParentId không hợp lệ" } }
                    });
                }
            }

            category.Name = updateDto.Name;
            category.Slug = updateDto.Slug;
            category.Description = updateDto.Description;
            category.ParentId = updateDto.ParentId;
            category.IsActive = updateDto.IsActive;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated category");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var category = await _context.ContentCategories.FindAsync(id);
            if (category == null)
            {
                throw new NotFoundException("Không tìm thấy danh mục");
            }

            var hasChildren = await _context.ContentCategories.AnyAsync(c => c.ParentId == id);
            if (hasChildren)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Category", new[] { "Không thể xóa danh mục vì có danh mục con" } }
                });
            }

            _context.ContentCategories.Remove(category);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
