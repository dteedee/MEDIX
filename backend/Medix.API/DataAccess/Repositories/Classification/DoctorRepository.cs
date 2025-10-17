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

        public async Task<List<Doctor>> GetHomePageDoctorsAsync()
        {
            return await _context.Doctors
                .Include(d => d.ServiceTier)
                .Where(d => d.ServiceTier.PriorityBoost >= 25)
                .OrderByDescending(d => d.ServiceTier.PriorityBoost)
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .ToListAsync();
        }

        public async Task<bool> LicenseNumberExistsAsync(string licenseNumber)
        {
            return await _context.Doctors.AnyAsync(d => d.LicenseNumber.ToLower() == licenseNumber.ToLower());
        }
    }
}
