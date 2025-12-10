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
        public async Task<List<Review>> GetReviewsByDoctorAsync(Guid doctorId)
        {
            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .Where(r => r.Appointment.DoctorId == doctorId)
                .ToListAsync();
        }

        public async Task<Review?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);
        }

        public async Task<Review?> GetByIdAsync(Guid reviewId)
        {
            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.Id == reviewId);
        }

        public async Task AddAsync(Review review)
        {
            await _context.Reviews.AddAsync(review);
        }

        public async Task UpdateAsync(Review review)
        {
            _context.Reviews.Update(review);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(Review review)
        {
            _context.Reviews.Remove(review);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task<List<Review>> GetReviewsByDoctorUserIdAsync(Guid userId)
        {
            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .Where(r => r.Appointment.Doctor.User.Id == userId)
                .ToListAsync();
        }

        public async Task<List<Review>> GetAllAsync()
        {
            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .ToListAsync();
        }

        public async Task<List<Review>> GetByAppointmentIdsAsync(IEnumerable<Guid> appointmentIds)
        {
            if (appointmentIds == null) return new List<Review>();

            var ids = appointmentIds.Distinct().ToList();
            if (ids.Count == 0) return new List<Review>();

            return await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .Where(r => ids.Contains(r.AppointmentId))
                .ToListAsync();
        }

        public async Task<List<(Guid DoctorId, string DoctorName, string Specialization, double AverageRating, int ReviewCount, string? ImageUrl)>> GetTopDoctorsByRatingAsync(int count = 3)
        {
            var topDoctors = await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.Specialization)
                .Where(r => r.Appointment.Doctor != null && r.Appointment.Doctor.User != null)
                .GroupBy(r => new
                {
                    DoctorId = r.Appointment.DoctorId,
                    DoctorName = r.Appointment.Doctor.User.FullName,
                    Specialization = r.Appointment.Doctor.Specialization.Name,
                    ImageUrl = r.Appointment.Doctor.User.AvatarUrl
                })
                .Select(g => new
                {
                    DoctorId = g.Key.DoctorId,
                    DoctorName = g.Key.DoctorName,
                    Specialization = g.Key.Specialization,
                    ImageUrl = g.Key.ImageUrl,
                    AverageRating = g.Average(r => r.Rating),
                    ReviewCount = g.Count()
                })
                .Where(x => x.ReviewCount >= 1) // only doctors with >= 1 review
                .OrderByDescending(x => x.AverageRating)
                .ThenByDescending(x => x.ReviewCount)
                .Take(count)
                .ToListAsync();

            return topDoctors
                .Select(d => (d.DoctorId, d.DoctorName, d.Specialization, d.AverageRating, d.ReviewCount, d.ImageUrl))
                .ToList();
        }

        public async Task<List<Doctor>> GetTopDoctorsFullAsync(int count = 3)
        {
            var topDoctorIds = await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                .Where(r => r.Appointment.Doctor != null)
                .GroupBy(r => r.Appointment.DoctorId)
                .OrderByDescending(g => g.Average(r => r.Rating))
                .ThenByDescending(g => g.Count())
                .Take(count)
                .Select(g => g.Key)
                .ToListAsync();

            var doctors = await _context.Doctors
                .Where(d => topDoctorIds.Contains(d.Id))
                .ToListAsync();

            return doctors;
        }
    }
}