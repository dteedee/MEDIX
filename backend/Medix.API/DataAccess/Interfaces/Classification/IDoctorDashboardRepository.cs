using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorDashboardRepository
    {
        Task<DoctorDashboardDto> GetDashboardAsync(Guid doctorId);
    }
}
