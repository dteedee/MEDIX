using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class RefArticleStatusRepository : IRefArticleStatusRepository
    {
        private readonly MedixContext _context;

        public RefArticleStatusRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RefArticleStatus>> GetActiveStatusesAsync()
        {
            return await _context.RefArticleStatuses
                .Where(s => s.IsActive)
                .OrderBy(s => s.DisplayName)
                .ToListAsync();
        }
    }
}