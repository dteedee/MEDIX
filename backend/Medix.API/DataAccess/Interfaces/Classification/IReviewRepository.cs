using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IReviewRepository
    {
        Task<List<Review>> GetReviewsByDoctorAsync(Guid id);
    }
}
