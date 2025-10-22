using Medix.API.Models.DTOs.ReviewDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IReviewService
    {
        Task<ReviewDoctorDto?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<ReviewDoctorDto> CreateAsync(CreateReviewDto dto);
        Task<ReviewDoctorDto> UpdateAsync(UpdateReviewDto dto);
        Task DeleteAsync(Guid appointmentId);

    }
}
