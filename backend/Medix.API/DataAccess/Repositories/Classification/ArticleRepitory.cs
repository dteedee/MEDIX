using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ArticleRepitory : IArticleRepository
    {
        private readonly MedixContext _context;

        public ArticleRepitory(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<HealthArticle>> GetHomePageArticlesAsync() =>
            await _context.HealthArticles
            .Where(a =>
                a.IsHomepageVisible
                && a.StatusCode == "published")
            .OrderByDescending(a => a.DisplayOrder)
            .ToListAsync();
    }
}
