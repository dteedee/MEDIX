using Medix.API.DataAccess;
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

        public async Task<List<Doctor>> GetDoctorsByServiceTierNameAsync(string name)
        {
         return await _context.Doctors
                .Include(d => d.ServiceTier)
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .Where(d => d.ServiceTier.Name.ToLower() == name.ToLower()&& d.User.Status !=0)
                .ToListAsync();
        }

        public async Task<(List<Doctor> Doctors, int TotalCount)> GetPaginatedDoctorsByTierIdAsync(
        Guid tierId, int pageNumber, int pageSize)
        {
            // 1. Tạo query cơ sở (với filter)
            var query = _context.Doctors
                .AsNoTracking()
                .Where(d => d.ServiceTierId == tierId && d.User.Status == 1); // Lọc status ở đây

            // 2. Lấy total count TRƯỚC khi phân trang
            var totalCount = await query.CountAsync();

            // 3. Lấy dữ liệu đã phân trang (OrderBy, Skip, Take) và Include
            var doctors = await query
                .OrderBy(d => d.User.FullName) // PHẢI OrderBy trước khi Skip/Take
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .ToListAsync();

            return (doctors, totalCount);
        }
    }
}
