using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IPatientRepository
    {
        public Task<Patient> SavePatientAsync(Patient patient);
        public Task<Patient?> GetPatientByUserIdAsync(Guid userId);
        public Task<Patient> UpdatePatientAsync(Patient patient);
    }
}
