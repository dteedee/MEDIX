using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using static Medix.API.Models.DTOs.DoctorBookinDto;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorService
    {
        Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role);
        Task<List<Doctor>> GetHomePageDoctorsAsync();
        Task<bool> LicenseNumberExistsAsync(string licenseNumber);
        Task<DoctorProfileDto?> GetDoctorProfileByUserNameAsync(string userName);
        Task<Doctor?> GetDoctorByUserIdAsync(Guid userId);
        Task<bool> UpdateDoctorProfileAsync(Doctor existingDoctor, DoctorProfileUpdateRequest req);

        Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(PaginationParams paginationParams);
    }
}
