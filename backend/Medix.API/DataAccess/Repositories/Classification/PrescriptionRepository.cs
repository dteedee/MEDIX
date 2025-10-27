using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class PrescriptionRepository : IPrescriptionRepository
    {
        private readonly MedixContext _context;

        public PrescriptionRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Prescription>> GetByMedicalRecordIdAsync(Guid medicalRecordId)
        {
            return await _context.Prescriptions
                .Include(p => p.Medication)
                .Where(p => p.MedicalRecordId == medicalRecordId)
                .ToListAsync();
        }

        public async Task<Prescription?> GetByIdAsync(Guid id)
        {
            return await _context.Prescriptions
                .Include(p => p.Medication)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task AddAsync(Prescription entity)
        {
            await _context.Prescriptions.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Prescription entity)
        {
            _context.Prescriptions.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _context.Prescriptions.FindAsync(id);
            if (entity != null)
            {
                _context.Prescriptions.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
