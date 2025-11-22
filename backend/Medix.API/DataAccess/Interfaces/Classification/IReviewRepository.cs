using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IReviewRepository
    {
        Task<List<Review>> GetReviewsByDoctorAsync(Guid id);
        Task<Review?> GetByAppointmentIdAsync(Guid appointmentId);
        Task AddAsync(Review review);
        Task UpdateAsync(Review review);
        Task DeleteAsync(Review review);
        Task SaveChangesAsync();
        Task<List<Review>> GetReviewsByDoctorUserIdAsync(Guid userId);

        Task<List<Review>> GetByAppointmentIdsAsync(IEnumerable<Guid> appointmentIds);

    }
}
