using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorScheduleRepository : IDoctorScheduleRepository
    {
        private readonly MedixContext _context;
        public DoctorScheduleRepository(MedixContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<DoctorSchedule>> GetAllAsync()
        {
            return await _context.DoctorSchedules
                .Include(ds => ds.Doctor)
                    .ThenInclude(d => d.User)  
                .ToListAsync();
        }

        public async Task<DoctorSchedule?> GetByIdAsync(Guid id)
        {
            return await _context.DoctorSchedules
                .Include(ds => ds.Doctor)
                    .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(ds => ds.Id == id);
        }

        public async Task AddAsync(DoctorSchedule entity)
        {
            await _context.DoctorSchedules.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(DoctorSchedule entity)
        {
            _context.DoctorSchedules.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _context.DoctorSchedules.FindAsync(id);
            if (entity != null)
            {
                _context.DoctorSchedules.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<IEnumerable<DoctorSchedule>> GetByDoctorAndDayAsync(Guid doctorId, int dayOfWeek)
        {
            var query = _context.DoctorSchedules
                .Include(s => s.Doctor)
                    .ThenInclude(d => d.User)
                .Where(s => s.DoctorId == doctorId);

            if (dayOfWeek >= 0)
                query = query.Where(s => s.DayOfWeek == dayOfWeek);

            return await query.ToListAsync();
        }
        public async Task<IDbContextTransaction> BeginTransactionAsync()
        {
            return await _context.Database.BeginTransactionAsync();
        }

    }
}
