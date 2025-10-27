using Medix.API.Business.Helper;
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
        Task<DoctorProfileDto?> GetDoctorProfileByDoctorIDAsync(string doctorID);
        Task<Doctor?> GetDoctorByUserIdAsync(Guid userId);
        Task<bool> UpdateDoctorProfileAsync(Doctor existingDoctor, DoctorProfileUpdateRequest req);
        Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorQuery query);
        Task ReviewDoctorProfile(DoctorProfileReviewRequest request, Guid doctorId);
        Task<Doctor?> GetDoctorByIdAsync(Guid id);
        Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(DoctorQueryParameters queryParams);
        Task<PagedList<Doctor>> GetReviewedDoctorsAsync(DoctorQuery query);
    }
}
