using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs.ReviewDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IReviewService
    {
        Task<ReviewDoctorDto?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<ReviewDoctorDto> CreateAsync(CreateReviewDto dto);
        Task<ReviewDoctorDto> UpdateAsync(UpdateReviewDto dto);
        Task DeleteAsync(Guid appointmentId);
        Task<List<ReviewDoctorDto>> GetByDoctorIdAsync(Guid doctorId);
        Task<List<ReviewDoctorDto>> GetByDoctorUserIdAsync(Guid userId);
        Task<List<ReviewDoctorDto>> GetAllAsync();
        Task<ReviewDoctorDto> UpdateStatusAsync(UpdateReviewStatusDto dto);

        Task<List<TopDoctorDto>> GetTopDoctorsByRatingAsync(int count = 3);
      
        Task<List<TopDoctorPerformanceDto>> GetTopDoctorsByPerformanceAsync(int count = 10, double ratingWeight = 0.6, double successWeight = 0.4);

    }


 
}
