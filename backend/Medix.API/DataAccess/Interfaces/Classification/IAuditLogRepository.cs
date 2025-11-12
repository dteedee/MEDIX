using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IAuditLogRepository
    {
        Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<AuditLog?> GetByIdAsync(long id);
    }
}
