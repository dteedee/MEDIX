using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;

namespace Medix.API.Business.Services.Classification
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _repository;

        public AuditLogService(IAuditLogRepository repository)
        {
            _repository = repository;
        }

        public async Task<(int total, IEnumerable<AuditLogDto> data)> GetPagedAsync(int page, int pageSize)
        {
            var (items, total) = await _repository.GetPagedAsync(page, pageSize);

            var data = items.Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserName = a.User?.FullName ?? "Unknown",
                ActionType = a.ActionType,
                EntityType = a.EntityType ?? string.Empty,
                EntityId = a.EntityId ?? string.Empty,
                Timestamp = a.Timestamp,
                IpAddress = a.IpAddress,
                OldValues = a.OldValues,
                NewValues = a.NewValues
            });

            return (total, data);
        }

        public async Task<AuditLogDto?> GetByIdAsync(long id)
        {
            var a = await _repository.GetByIdAsync(id);
            if (a == null) return null;

            return new AuditLogDto
            {
                Id = a.Id,
                UserName = a.User?.FullName ?? "Unknown",
                ActionType = a.ActionType,
                EntityType = a.EntityType ?? string.Empty,
                EntityId = a.EntityId ?? string.Empty,
                Timestamp = a.Timestamp,
                IpAddress = a.IpAddress,
                OldValues = a.OldValues,
                NewValues = a.NewValues
            };
        }
    }
}