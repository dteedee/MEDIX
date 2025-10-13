using Medix.API.Data;
using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface IPatientRepository
    {
        public Task<Patient> SavePatientAsync(Patient patient);
    }
    public class PatientRepository : IPatientRepository
    {
        private readonly MedixContext _context;

        public PatientRepository(MedixContext context)
        {
            _context = context;
        }
        public async Task<Patient> SavePatientAsync(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return patient;
        }
    }
}
