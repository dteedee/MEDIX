using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IReviewRepository
    {
        Task<List<Review>> GetReviewsByDoctorAsync(Guid id);
        Task<Review?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<Review?> GetByIdAsync(Guid reviewId);
        Task AddAsync(Review review);
        Task UpdateAsync(Review review);
        Task DeleteAsync(Review review);
        Task SaveChangesAsync();
        Task<List<Review>> GetReviewsByDoctorUserIdAsync(Guid userId);
        Task<List<Review>> GetAllAsync();

        Task<List<Review>> GetByAppointmentIdsAsync(IEnumerable<Guid> appointmentIds);
        Task<List<(Guid DoctorId, string DoctorName, string Specialization, double AverageRating, int ReviewCount, string? ImageUrl)>> GetTopDoctorsByRatingAsync(int count = 3);


    }
}
