using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorDashboardService
    {
        Task<DoctorDashboardDto> GetDashboardAsync(Guid doctorId);
        Task<DoctorDashboardDto?> GetDashboardByUserIdAsync(Guid userId);

    }
}
