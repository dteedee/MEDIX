using Microsoft.EntityFrameworkCore;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ContentCategoryRepository : IContentCategoryRepository
    {
        private readonly MedixContext _context;

        public ContentCategoryRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<ContentCategory> Categories, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.ContentCategories
                .Include(c => c.Parent)
                .OrderBy(c => c.Name);

            var totalCount = await query.CountAsync();
            var categories = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (categories, totalCount);
        }

        public async Task<IEnumerable<ContentCategory>> GetAllActiveAsync()
        {
            return await _context.ContentCategories
                .Where(c => c.IsActive)
                .Include(c => c.Parent)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<ContentCategory?> GetByIdWithParentAsync(Guid id)
        {
            return await _context.ContentCategories
                .Include(c => c.Parent)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<ContentCategory?> GetBySlugAsync(string slug)
        {
            return await _context.ContentCategories
                .FirstOrDefaultAsync(c => c.Slug == slug);
        }

        public async Task<bool> NameExistsAsync(string name, Guid? excludeId = null)
        {
            var query = _context.ContentCategories.Where(c => c.Name == name);
            
            if (excludeId.HasValue)
                query = query.Where(c => c.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null)
        {
            var query = _context.ContentCategories.Where(c => c.Slug == slug);
            
            if (excludeId.HasValue)
                query = query.Where(c => c.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<ContentCategory> CreateAsync(ContentCategory category)
        {
            _context.ContentCategories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<ContentCategory> UpdateAsync(ContentCategory category)
        {
            _context.ContentCategories.Update(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var category = await _context.ContentCategories.FindAsync(id);
            if (category == null)
                return false;

            _context.ContentCategories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasChildrenAsync(Guid categoryId)
        {
            return await _context.ContentCategories
                .AnyAsync(c => c.ParentId == categoryId);
        }
    }
}
