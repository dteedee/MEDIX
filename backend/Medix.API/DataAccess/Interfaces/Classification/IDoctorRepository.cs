using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorRepository
    {
        Task<Doctor> CreateDoctorAsync(Doctor doctor);
        Task<List<Doctor>> GetHomePageDoctorsAsync();
        Task<bool> LicenseNumberExistsAsync(string licenseNumber);
        Task<Doctor?> GetDoctorByUserNameAsync(string userName);
        Task<Doctor?> GetDoctorByUserIdAsync(Guid userId);
        Task<Doctor> UpdateDoctorAsync(Doctor doctor);
        Task<List<Doctor>> GetDoctorsByServiceTierNameAsync(string name);
        Task<(List<Doctor> Doctors, int TotalCount)> GetPaginatedDoctorsByTierIdAsync(
        Guid tierId, int pageNumber, int pageSize);
    }
}
