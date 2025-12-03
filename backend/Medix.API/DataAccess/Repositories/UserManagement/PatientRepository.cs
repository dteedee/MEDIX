using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.UserManagement
{
    public class PatientRepository : IPatientRepository
    {
        private readonly MedixContext _context;

        public PatientRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<Patient?> GetPatientByUserIdAsync(Guid userId)
        {
            return await _context.Patients
                 .Include(p => p.User)
                 .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Patient> SavePatientAsync(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return patient;
        }

        public async Task<Patient> UpdatePatientAsync(Patient patient)
        {
            _context.Patients.Update(patient);
            await _context.SaveChangesAsync();
            return patient;
        }
    }
}
