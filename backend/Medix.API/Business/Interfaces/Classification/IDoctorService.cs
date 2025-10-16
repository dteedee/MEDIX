using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorService
    {
        Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role);
        Task<List<Doctor>> GetHomePageDoctorsAsync();
        Task<bool> LicenseNumberExistsAsync(string licenseNumber);
    }
}
