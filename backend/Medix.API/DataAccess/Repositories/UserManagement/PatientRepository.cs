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

        public Task<Patient?> GetPatientByUserIdAsync(Guid userId)
        {
            return _context.Patients
                 .AsNoTracking()
                 .Include(p => p.User)
                 .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Patient> SavePatientAsync(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return patient;
        }

        public Task<Patient> UpdatePatientAsync(Patient patient)
        {
            return Task.Run(async () =>
               {
                   _context.Patients.Update(patient);
                   await _context.SaveChangesAsync();
                   return patient;
               });
        }
    }
}
