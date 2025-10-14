using Medix.API.Data.Models;

namespace Medix.API.Application.Services
{
    public interface IDoctorService
    {
        Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role);
    }
}
