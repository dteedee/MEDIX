using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IArticleService
    {
        Task<List<HealthArticle>> GetHomePageArticles();
    }
}
