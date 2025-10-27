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

        public Task<List<DoctorSchedule>> GetDoctorSchedulesByDoctorIdAsync(Guid doctorId)
        {
            return _context.DoctorSchedules
                .Where(ds => ds.DoctorId == doctorId&& ds.IsAvailable==true)
                .ToListAsync();
        }
    }
}
