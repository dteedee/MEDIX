using Medix.API.Business.Helper;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using static Medix.API.Models.DTOs.DoctorBookinDto;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorService
    {
        Task<List<Doctor>> GetHomePageDoctorsAsync();
        Task<bool> LicenseNumberExistsAsync(string licenseNumber);
        Task<DoctorProfileDto?> GetDoctorProfileByDoctorIDAsync(string doctorID);
        Task<Doctor?> GetDoctorByUserIdAsync(Guid userId);
        Task<bool> UpdateDoctorProfileAsync(Doctor existingDoctor, DoctorProfileUpdateRequest req);
        //Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorQuery query);
        //Task ReviewDoctorProfile(DoctorReviewRequest request, Guid doctorId);
        Task<Doctor?> GetDoctorByIdAsync(Guid id);
        Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(DoctorQueryParameters queryParams);
        Task<PagedList<DoctorDto>> GetDoctorsAsync(DoctorQuery query);

        Task<IEnumerable<EducationWithPaginatedDoctorsDto>> GetDoctorsByEducationAsync(DoctorQueryParameters queryParams);
        Task<List<Doctor>> GetAllAsync();

    }
}
