using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IArticleRepository
    {
        Task<List<HealthArticle>> GetHomePageArticlesAsync();
    }
}
