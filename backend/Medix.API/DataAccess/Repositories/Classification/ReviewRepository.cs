using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly MedixContext _context;
        public ReviewRepository(MedixContext context)
        {
            _context = context;
        }
        public async Task<List<Review>> GetReviewsByDoctorAsync(Guid id)
        {
            return await _context.Reviews
                .Where(r => r.Appointment.DoctorId == id)
                .ToListAsync();
        }
    }
}
