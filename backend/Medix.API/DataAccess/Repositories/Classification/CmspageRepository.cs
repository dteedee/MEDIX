using Microsoft.EntityFrameworkCore;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class CmspageRepository : ICmspageRepository
    {
        private readonly MedixContext _context;

        public CmspageRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cmspage>> GetAllWithAuthorAsync()
        {
            return await _context.Cmspages
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Cmspage?> GetByIdWithAuthorAsync(Guid id)
        {
            return await _context.Cmspages
                .Include(p => p.Author)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Cmspage?> GetBySlugAsync(string slug)
        {
            return await _context.Cmspages
                .FirstOrDefaultAsync(p => p.PageSlug == slug);
        }

        public async Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null)
        {
            var query = _context.Cmspages.Where(p => p.PageSlug == slug);
            
            if (excludeId.HasValue)
                query = query.Where(p => p.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<Cmspage> CreateAsync(Cmspage page)
        {
            _context.Cmspages.Add(page);
            await _context.SaveChangesAsync();
            return page;
        }

        public async Task<Cmspage> UpdateAsync(Cmspage page)
        {
            _context.Cmspages.Update(page);
            await _context.SaveChangesAsync();
            return page;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var page = await _context.Cmspages.FindAsync(id);
            if (page == null)
                return false;

            _context.Cmspages.Remove(page);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UserExistsAsync(Guid userId)
        {
            return await _context.Users.AnyAsync(u => u.Id == userId);
        }

        public async Task<(IEnumerable<Cmspage> Pages, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.Cmspages
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var pages = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (pages, totalCount);
        }

        public async Task<IEnumerable<Cmspage>> SearchByNameAsync(string name)
        {
            return await _context.Cmspages
                .Where(p => EF.Functions.Like(p.PageTitle, $"%{name}%") || EF.Functions.Like(p.MetaTitle, $"%{name}%"))
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
    }
}
