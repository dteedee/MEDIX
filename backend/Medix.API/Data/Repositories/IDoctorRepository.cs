using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface IDoctorRepository
    {
        Task<Doctor> CreateDoctorAsync(Doctor doctor);
    }
}
