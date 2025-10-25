using Medix.API.Business.Helper;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorRepository : IDoctorRepository
    {
        public MedixContext _context;

        public DoctorRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<Doctor> CreateDoctorAsync(Doctor doctor)
        {
            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();
            return doctor;
        }

        public async Task<List<Doctor>> GetHomePageDoctorsAsync()
        {
            return await _context.Doctors
                .Include(d => d.ServiceTier)
                .Where(d => d.ServiceTier.PriorityBoost >= 25)
                .OrderByDescending(d => d.ServiceTier.PriorityBoost)
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .ToListAsync();
        }

        public async Task<bool> LicenseNumberExistsAsync(string licenseNumber)
        {
            return await _context.Doctors.AnyAsync(d => d.LicenseNumber.ToLower() == licenseNumber.ToLower());
        }

        public async Task<Doctor?> GetDoctorByUserNameAsync(string userName)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .FirstOrDefaultAsync(d => d.User.UserName.ToLower() == userName.ToLower());
        }

        public async Task<Doctor?> GetDoctorByUserIdAsync(Guid userId)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.User.Id == userId);
        }

        public async Task<Doctor> UpdateDoctorAsync(Doctor doctor)
        {
            _context.Doctors.Update(doctor);
            await _context.SaveChangesAsync();
            return doctor;
        }

        public async Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorProfileQuery query)
        {
            var doctorQueryable = _context.Doctors
                .Where(d => d.User.Status == 2)
                .AsQueryable();

            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                doctorQueryable = doctorQueryable
                    .Where(d => d.User.UserName.Contains(query.SearchTerm) ||
                        d.Specialization.Name.Contains(query.SearchTerm) || 
                        d.User.NormalizedEmail.Contains(query.SearchTerm.ToUpper()));
            }

            var doctors = await doctorQueryable
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedList<Doctor>
            {
                Items = doctors,
                TotalPages = (int)Math.Ceiling((double)await doctorQueryable.CountAsync() / query.PageSize),
            };
        }

        public async Task<Doctor?> GetDoctorByIdAsync(Guid doctorId)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .FirstOrDefaultAsync(d => d.Id == doctorId);
        }
    }
}
