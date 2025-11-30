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

        public async Task<IEnumerable<MedicationDatabase>> GetAllIncludingInactiveAsync()
        {
            return await _context.MedicationDatabases
                .OrderBy(m => m.MedicationName)
                .ToListAsync();
        }

        public async Task<IEnumerable<MedicationDatabase>> SearchAsync(string query, int limit = 10)
        {
            var normalizedQuery = query.ToLower();

            return await _context.MedicationDatabases
                .Where(m => m.IsActive && m.MedicationName.ToLower().Contains(normalizedQuery))
                .Take(limit) 
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<MedicationDatabase> CreateAsync(MedicationDatabase medication)
        {
            medication.Id = Guid.NewGuid();
            medication.CreatedAt = DateTime.UtcNow;
            _context.MedicationDatabases.Add(medication);
            await _context.SaveChangesAsync();
            return medication;
        }

        public async Task<MedicationDatabase> UpdateAsync(MedicationDatabase medication)
        {
            _context.MedicationDatabases.Update(medication);
            await _context.SaveChangesAsync();
            return medication;
        }
    }
}
