using Medix.API.Business.Helper;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
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
                .Include(d => d.Specialization)
                .Include(d => d.ServiceTier)
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
                   .Where(d => d.ServiceTier.Name.ToLower() == name.ToLower() && d.User.Status != 0)
                   .ToListAsync();
        }
        public async Task<(List<Doctor> Doctors, int TotalCount)> GetPaginatedDoctorsByTierIdAsync(
                Guid tierId, DoctorQueryParameters queryParams)
        {
            var query = _context.Doctors
                .AsNoTracking()
                .Where(d => d.ServiceTierId == tierId && d.User.Status == 1);

            // 2. Áp dụng FILTER động
            // Filter 1: Education
            if (!string.IsNullOrEmpty(queryParams.EducationCode))
            {
                query = query.Where(d => d.Education == queryParams.EducationCode);
            }
            if (queryParams.MinPrice.HasValue)
            {
                query = query.Where(d => d.ConsultationFee >= queryParams.MinPrice.Value);
            }
            if (queryParams.MaxPrice.HasValue)
            {
                query = query.Where(d => d.ConsultationFee <= queryParams.MaxPrice.Value);
            }

            // Filter 2: Specialization
            if (!string.IsNullOrEmpty(queryParams.SpecializationCode))
            {
                // Quan trọng: Phải filter trên 'Specialization.Code'
                query = query.Where(d => d.Specialization.Id == Guid.Parse(queryParams.SpecializationCode));
            }

            // 3. Lấy total count SAU KHI FILTER
            var totalCount = await query.CountAsync();

            // 4. Áp dụng PHÂN TRANG và Includes
            var doctors = await query
                .OrderBy(d => d.User.FullName) // Luôn OrderBy trước khi phân trang
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .ToListAsync();

            return (doctors, totalCount);
        }

        public Task<Doctor?> GetDoctorProfileByDoctorIDAsync(Guid doctorID)
        {
            return _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .FirstOrDefaultAsync(d => d.Id == doctorID);
        }

        //public async Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorQuery query)
        //{
        //    var doctorQueryable = _context.Doctors
        //        .Where(d => d.User.Status == 2)
        //        .AsQueryable();

        //    if (!string.IsNullOrEmpty(query.SearchTerm))
        //    {
        //        doctorQueryable = doctorQueryable
        //            .Where(d => d.User.FullName.ToLower().Contains(query.SearchTerm.ToLower()) ||
        //                d.Specialization.Name.ToLower().Contains(query.SearchTerm.ToLower()) ||
        //                d.User.NormalizedEmail.Contains(query.SearchTerm.ToUpper()));
        //    }

        //    if (query.PageSize == 0)
        //    {
        //        query.PageSize = 10;
        //    }

        //    var doctors = await doctorQueryable
        //        .Include(d => d.User)
        //        .Include(d => d.Specialization)
        //        .Skip((query.Page - 1) * query.PageSize)
        //        .Take(query.PageSize)
        //        .ToListAsync();

        //    return new PagedList<Doctor>
        //    {
        //        Items = doctors,
        //        TotalPages = (int)Math.Ceiling((double)await doctorQueryable.CountAsync() / query.PageSize),
        //    };
        //}

        public async Task<Doctor?> GetDoctorByIdAsync(Guid doctorId)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .Include(d => d.ServiceTier)
                .Include(d => d.Appointments)
                    .ThenInclude(a => a.Review)
                .FirstOrDefaultAsync(d => d.Id == doctorId);
        }

        public async Task<PagedList<Doctor>> GetDoctorsAsync(DoctorQuery query)
        {
            var doctorQueryable = _context.Doctors
                .Where(d => d.User.Status == 0 || d.User.Status == 1)
                .AsQueryable();

            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                doctorQueryable = doctorQueryable
                    .Where(d => d.User.FullName.ToLower().Contains(query.SearchTerm.ToLower()) ||
                        d.Specialization.Name.ToLower().Contains(query.SearchTerm.ToLower()) ||
                        d.User.NormalizedEmail.Contains(query.SearchTerm.ToUpper()));
            }

            if (query.Page < 1) { query.Page = 1; }
            if (query.PageSize < 0) { query.PageSize = 0; }

            doctorQueryable = doctorQueryable
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .Include(d => d.ServiceTier)
                .Include(d => d.Appointments)
                    .ThenInclude(a => a.Review);

            if (query.PageSize > 0)
            {
                doctorQueryable = doctorQueryable
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize);
            }

            var doctors = await doctorQueryable.ToListAsync();

            return new PagedList<Doctor>
            {
                Items = doctors,
                TotalPages = (int)Math.Ceiling((double)await doctorQueryable.CountAsync() / query.PageSize),
            };
        }

        public async Task<List<Doctor>> GetAllAsync()
            => await _context.Doctors
                .Include(d => d.Appointments)
                .ToListAsync();
    }
}
