using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

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
            return await _context.DoctorSchedules
                .Where(s => s.DoctorId == doctorId && s.DayOfWeek == dayOfWeek)
                .ToListAsync();
        }
    }
}
