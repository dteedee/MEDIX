using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class MedicationRepository : IMedicationRepository
    {
        private readonly MedixContext _context;

        public MedicationRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MedicationDatabase>> GetAllAsync()
        {
            return await _context.MedicationDatabases
                .Where(m => m.IsActive)
                .OrderBy(m => m.MedicationName)
                .ToListAsync();
        }

        public async Task<MedicationDatabase?> GetByIdAsync(Guid id)
        {
            return await _context.MedicationDatabases
                .FirstOrDefaultAsync(m => m.Id == id);
        }
    }
}
