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

    }
}
