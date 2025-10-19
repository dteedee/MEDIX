using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorRepository : IDoctorRepository
    {
        public MedixContext _context;

        public DoctorRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<Doctor> CreateDoctorAsync(Doctor doctor)
        {
            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();
            return doctor;
        }

        public async Task<List<Doctor>> GetDoctorsWithTierIDAsync(string tierID)
        {
            if (!Guid.TryParse(tierID, out var tierGuid))
                return new List<Doctor>();

            return await _context.Doctors
                .Where(d => d.ServiceTierId == tierGuid)
                .ToListAsync();
        }

     
    }
}
