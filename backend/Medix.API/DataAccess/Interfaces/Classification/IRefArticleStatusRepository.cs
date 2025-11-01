using Medix.API.Models.Enums;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IRefArticleStatusRepository
    {
        Task<IEnumerable<RefArticleStatus>> GetActiveStatusesAsync();
    }
}