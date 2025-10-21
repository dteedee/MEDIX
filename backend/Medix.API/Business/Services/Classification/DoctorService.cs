using Medix.API.DataAccess;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.Entities;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly MedixContext _context;

        public DoctorService(IDoctorRepository doctorRepository, IUserRepository userRepository,
            MedixContext context, IReviewRepository reviewRepository)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _context = context;
            _reviewRepository = reviewRepository;
        }

        //public Task<List<DoctorBookingDto>> GetDoctorsByServiceTierIdAsync(string tierID)
        //{
        //    var doctors = _doctorRepository.GetDoctorsWithTierIDAsync(tierID);
        //    //var doctorDtos = doctors.Result.Select(d => new DoctorBookingDto
        //    //{
        //    //    DoctorId = d.Id,
        //    //    FullName = d.FullName,
        //    //    Specialty = d.Specialty,
        //    //    ServiceTierId = d.ServiceTierId
        //    //}).ToList();
        //    return null;
        //}

        public async Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var createdUser = await _userRepository.CreateAsync(user);
                if (createdUser == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }
                var createdDoctor = await _doctorRepository.CreateDoctorAsync(doctor);
                if (createdDoctor == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }
                var userRole = await _userRepository.CreateUserRoleAsync(role);
                if (userRole == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<Doctor>> GetHomePageDoctorsAsync()
        {
            return await _doctorRepository.GetHomePageDoctorsAsync();
        }

        public async Task<bool> LicenseNumberExistsAsync(string licenseNumber) => await _doctorRepository.LicenseNumberExistsAsync(licenseNumber);

        public async Task<DoctorProfileDto?> GetDoctorProfileByUserNameAsync(string userName)
        {
            var doctor = await _doctorRepository.GetDoctorByUserNameAsync(userName);
            if (doctor == null) { return null; }
            var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctor.Id);
            int[] ratingByStar = new int[5];
            foreach (var review in reviews)
            {
                if (review.Rating >= 1 && review.Rating <= 5)
                {
                    ratingByStar[review.Rating - 1]++;
                }
            }

            var profileDto = new DoctorProfileDto
            {
                FullName = doctor.User.FullName,
                AverageRating = reviews.Count > 0
                    ? Math.Round((decimal)reviews.Average(r => r.Rating), 1)
                    : 0,
                Specialization = doctor.Specialization.Name,
                Biography = doctor.Bio,
                AvatarUrl = doctor.User.AvatarUrl,
                NumberOfReviews = reviews.Count,
                RatingByStar = ratingByStar,
            };

            profileDto.Reviews = reviews.OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Rating = r.Rating,
                    Comment = r.Comment,
                    Date = r.CreatedAt.ToString("dd/MM/yyyy"),
                })
                .Take(4)
                .ToList();

            return profileDto;
        }

        public async Task<Doctor?> GetDoctorByUserIdAsync(Guid userId)
        {
            return await _doctorRepository.GetDoctorByUserIdAsync(userId);
        }

        public async Task<bool> UpdateDoctorProfileAsync(Doctor existingDoctor, DoctorProfileUpdateRequest req)
        {
            existingDoctor.User.FullName = req.FullName;
            existingDoctor.User.DateOfBirth = (req.Dob == null || string.IsNullOrWhiteSpace(req.Dob)) ? null : DateOnly.Parse(req.Dob);
            if (existingDoctor.User.PhoneNumber != req.PhoneNumber)
            {
                existingDoctor.User.PhoneNumber = req.PhoneNumber;
                existingDoctor.User.PhoneNumberConfirmed = false;
            }

            existingDoctor.Bio = req.Bio;
            existingDoctor.Education = req.Education;
            existingDoctor.YearsOfExperience = (int)(req.YearsOfExperience == null ? 0 : req.YearsOfExperience);

            var updatedDoctor = await _doctorRepository.UpdateDoctorAsync(existingDoctor);
            return updatedDoctor != null;
        }
    }
}
