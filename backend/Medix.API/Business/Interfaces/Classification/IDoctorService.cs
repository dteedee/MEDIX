using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorService
    {
        Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role);
        Task<List<DoctorBookingDto>> GetDoctorsByServiceTierIdAsync(string tierID);
    }
}
