using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using static Medix.API.Models.DTOs.DoctorBookinDto;
using Medix.API.Models.Enums;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly MedixContext _context;
        private readonly IDoctorScheduleRepository _doctorScheduleRepository;

        private readonly IServiceTierRepository _serviceTierRepo;
        private readonly IServiceTierRepository _serviceTierRepository;

        public DoctorService(IDoctorRepository doctorRepository, IUserRepository userRepository,
            MedixContext context, IReviewRepository reviewRepository, IServiceTierRepository serviceTierRepository, IServiceTierRepository serviceTierRepo, IDoctorScheduleRepository doctorScheduleRepository)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _context = context;
            _reviewRepository = reviewRepository;
            _serviceTierRepository = serviceTierRepository;
            _serviceTierRepo = serviceTierRepo;
            _doctorScheduleRepository = doctorScheduleRepository;
        }


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

        //public async Task<DoctorProfileDto?> GetDoctorProfileByUserNameAsync(string userName)
        //{
        //    var doctor = await _doctorRepository.GetDoctorByUserNameAsync(userName);
        //    if (doctor == null) { return null; }
        //    var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctor.Id);
        //    int[] ratingByStar = new int[5];
        //    foreach (var review in reviews)
        //    {
        //        if (review.Rating >= 1 && review.Rating <= 5)
        //        {
        //            ratingByStar[review.Rating - 1]++;
        //        }
        //    }

        //    var profileDto = new DoctorProfileDto
        //    {
        //        FullName = doctor.User.FullName,
        //        AverageRating = reviews.Count > 0
        //            ? Math.Round((decimal)reviews.Average(r => r.Rating), 1)
        //            : 0,
        //        Specialization = doctor.Specialization.Name,
        //        Biography = doctor.Bio,
        //        AvatarUrl = doctor.User.AvatarUrl,
        //        NumberOfReviews = reviews.Count,
        //        RatingByStar = ratingByStar,
        //    };

        //    profileDto.Reviews = reviews.OrderByDescending(r => r.CreatedAt)
        //        .Select(r => new ReviewDto
        //        {
        //            Rating = r.Rating,
        //            Comment = r.Comment,
        //            Date = r.CreatedAt.ToString("dd/MM/yyyy"),
        //        })
        //        .Take(4)
        //        .ToList();

        //    return profileDto;
        //}

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

        public async Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(
         DoctorQueryParameters queryParams) // <-- THAY ĐỔI Ở ĐÂY
        {
            var tiers = await _serviceTierRepo.GetActiveTiersAsync();
            var resultList = new List<ServiceTierWithPaginatedDoctorsDto>();

            foreach (var tier in tiers)
            {
                // 3. Truyền toàn bộ queryParams xuống Repository
                var (doctors, totalCount) = await _doctorRepository.GetPaginatedDoctorsByTierIdAsync(
                    tier.Id,
                    queryParams); // <-- THAY ĐỔI Ở ĐÂY

                // 4. Map sang DoctorBookinDto của bạn
                var doctorDtos = doctors.Select(doc => new DoctorBookinDto
                {
                    userId = doc.User.Id,
                    DoctorId = doc.Id,
                    DoctorName = doc.User.FullName,
                    specializationCode = doc.Specialization.Code,
                    specialization = doc.Specialization.Name,
                    educationcode = doc.Education,
                    Education = DoctorDegree.GetDescription(doc.Education), // Giả sử bạn có lớp này
                    Experience = doc.YearsOfExperience.ToString(),
                    price = doc.ConsultationFee,
                    bio = doc.Bio,
                    rating = doc.AverageRating,
                    AvatarUrl = doc.User.AvatarUrl
                }).ToList();

                // 5. Tạo DTO phân trang
                var paginatedDoctors = new PaginatedListDto<DoctorBookinDto>(
                    doctorDtos,
                    queryParams.PageNumber,
                    queryParams.PageSize,
                    totalCount);

                // 6. Thêm vào kết quả
                resultList.Add(new ServiceTierWithPaginatedDoctorsDto
                {
                    Id = tier.Id,
                    Name = tier.Name,
                    Description = tier.Description,
                    Doctors = paginatedDoctors
                });
            }
            return resultList;
        }

        public async Task<DoctorProfileDto?> GetDoctorProfileByDoctorIDAsync(string doctorID)
        {
            var doctor = await _doctorRepository.GetDoctorProfileByDoctorIDAsync(Guid.Parse(doctorID));
            if (doctor == null) { return null; }
            var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctor.Id);
            var schedule = await _doctorScheduleRepository.GetDoctorSchedulesByDoctorIdAsync(doctor.Id);
            int[] ratingByStar = new int[5];
            foreach (var review in reviews)
            {
                if (review.Rating >= 1 && review.Rating <= 5)
                {
                    ratingByStar[review.Rating - 1]++;
                }
            }

            var profileDto = new DoctorProfileDto
            { consulationFee =doctor.ConsultationFee,
                FullName = doctor.User.FullName,
                AverageRating = reviews.Count > 0
                    ? Math.Round((decimal)reviews.Average(r => r.Rating), 1)
                    : 0,
                Specialization = doctor.Specialization.Name,
                Biography = doctor.Bio,
                Education = DoctorDegree.GetDescription(doctor.Education),
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
            profileDto.Schedules = schedule
                .Select(s => new DoctorScheduleDto
                {
                    Id = s.Id,
                    DoctorId = s.DoctorId,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    IsAvailable = s.IsAvailable
                })
                .ToList();

            return profileDto;
        }
    }
}
