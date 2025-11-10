using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IAuditLogService
    {
        Task<(int total, IEnumerable<AuditLogDto> data)> GetPagedAsync(int page, int pageSize);
        Task<AuditLogDto?> GetByIdAsync(long id);
    }
}
