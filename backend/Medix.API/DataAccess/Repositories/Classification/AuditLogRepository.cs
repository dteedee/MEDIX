using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly MedixContext _context;

        public AuditLogRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.Timestamp);

            var total = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<AuditLog?> GetByIdAsync(long id)
        {
            return await _context.AuditLogs
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == id);
        }
    }
}
