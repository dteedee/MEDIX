using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorScheduleOverrideRepository : IDoctorScheduleOverrideRepository
    {
        private readonly MedixContext _context;

        public DoctorScheduleOverrideRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorScheduleOverride>> GetByDoctorIdAsync(Guid doctorId)
        {
            return await _context.DoctorScheduleOverrides
                .Where(x => x.DoctorId == doctorId)
                .OrderBy(x => x.OverrideDate)
                .ToListAsync();
        }

        public async Task<DoctorScheduleOverride?> GetByIdAsync(Guid id)
        {
            return await _context.DoctorScheduleOverrides.FindAsync(id);
        }

        public async Task AddAsync(DoctorScheduleOverride entity)
        {
            await _context.DoctorScheduleOverrides.AddAsync(entity);
        }

        public async Task UpdateAsync(DoctorScheduleOverride entity)
        {
            _context.DoctorScheduleOverrides.Update(entity);
        }

        public async Task DeleteAsync(DoctorScheduleOverride entity)
        {
            _context.DoctorScheduleOverrides.Remove(entity);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task<Guid?> GetDoctorIdByUserIdAsync(Guid userId)
        {
            return await _context.Doctors
                .Where(d => d.UserId == userId)
                .Select(d => (Guid?)d.Id)
                .FirstOrDefaultAsync();
        }

    }
}