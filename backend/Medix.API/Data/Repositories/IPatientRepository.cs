using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface IPatientRepository
    {
        public Task<Patient> SavePatientAsync(Patient patient);
    }

}
