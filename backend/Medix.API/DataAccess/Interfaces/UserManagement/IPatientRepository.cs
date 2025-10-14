using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IPatientRepository
    {
        public Task<Patient> SavePatientAsync(Patient patient);
    }
}
