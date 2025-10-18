using Microsoft.EntityFrameworkCore;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class HealthArticleRepository : IHealthArticleRepository
    {
        private readonly MedixContext _context;

        public HealthArticleRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync();
            var articles = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (articles, totalCount);
        }

        public async Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetPublishedPagedAsync(int page, int pageSize)
        {
            var query = _context.HealthArticles
                .Where(a => a.StatusCode == "Published")
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync();
            var articles = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (articles, totalCount);
        }

        public async Task<HealthArticle?> GetByIdWithDetailsAsync(Guid id)
        {
            return await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<HealthArticle?> GetBySlugAsync(string slug)
        {
            return await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .FirstOrDefaultAsync(a => a.Slug == slug);
        }

        public async Task<(IEnumerable<HealthArticle> Articles, int TotalCount)> GetByCategoryAsync(Guid categoryId, int page, int pageSize)
        {
            var query = _context.HealthArticles
                .Where(a => a.Categories.Any(c => c.Id == categoryId) && a.StatusCode == "Published")
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync();
            var articles = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (articles, totalCount);
        }

        public async Task<IEnumerable<HealthArticle>> GetHomepageArticlesAsync(int limit)
        {
            return await _context.HealthArticles
                .Where(a => a.StatusCode == "Published" && a.IsHomepageVisible)
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .OrderBy(a => a.DisplayOrder)
                .ThenByDescending(a => a.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<HealthArticle>> SearchByNameAsync(string name)
        {
            var query = _context.HealthArticles
                .Where(a => a.StatusCode == "Published" &&
                            (EF.Functions.Like(a.Title, $"%{name}%") || EF.Functions.Like(a.Summary, $"%{name}%")))
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.CreatedAt);

            return await query.ToListAsync();
        }

        public async Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(slug))
                return false;

            var normalized = slug.Trim().ToLowerInvariant();
            var query = _context.HealthArticles.Where(a => a.Slug != null && a.Slug.ToLower() == normalized);

            if (excludeId.HasValue)
                query = query.Where(a => a.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> TitleExistsAsync(string title, Guid? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                return false;

            var normalized = title.Trim().ToLowerInvariant();
            var query = _context.HealthArticles.Where(a => a.Title != null && a.Title.ToLower() == normalized);

            if (excludeId.HasValue)
                query = query.Where(a => a.Id != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<HealthArticle> CreateAsync(HealthArticle article)
        {
            _context.HealthArticles.Add(article);
            await _context.SaveChangesAsync();
            return article;
        }

        public async Task<HealthArticle> UpdateAsync(HealthArticle article)
        {
            _context.HealthArticles.Update(article);
            await _context.SaveChangesAsync();
            return article;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var article = await _context.HealthArticles.FindAsync(id);
            if (article == null)
                return false;

            _context.HealthArticles.Remove(article);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task IncrementViewCountAsync(Guid id)
        {
            var article = await _context.HealthArticles.FindAsync(id);
            if (article != null)
            {
                article.ViewCount++;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> UserExistsAsync(Guid userId)
        {
            return await _context.Users.AnyAsync(u => u.Id == userId);
        }
    }
}
