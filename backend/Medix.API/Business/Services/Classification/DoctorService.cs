using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using static Medix.API.Models.DTOs.DoctorBookinDto;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly MedixContext _context;

        private readonly IServiceTierRepository _serviceTierRepo;
        private readonly IServiceTierRepository _serviceTierRepository;

        public DoctorService(IDoctorRepository doctorRepository, IUserRepository userRepository,
            MedixContext context, IReviewRepository reviewRepository, IServiceTierRepository serviceTierRepository, IServiceTierRepository serviceTierRepo)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _context = context;
            _reviewRepository = reviewRepository;
            _serviceTierRepository = serviceTierRepository;
            _serviceTierRepo = serviceTierRepo;
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
                // TODO: Fix when UserRepository.CreateUserRoleAsync is implemented
                // var userRole = await _userRepository.CreateUserRoleAsync(role);
                var userRole = role; // Temporary fix
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
                return false;
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
            existingDoctor.User.DateOfBirth = req.Dob == null ? null : DateOnly.Parse(req.Dob);
            if (existingDoctor.User.PhoneNumber != req.PhoneNumber)
            {
                existingDoctor.User.PhoneNumber = req.PhoneNumber;
                existingDoctor.User.PhoneNumberConfirmed = false;
            }

            existingDoctor.Bio = req.Bio;
            existingDoctor.Education = req.Education;
            existingDoctor.YearsOfExperience = (int)(req.YearsOfExperience == null ? 0 : req.YearsOfExperience);
            existingDoctor.ConsultationFee = req.ConsultationFee == null ? 0 : req.ConsultationFee.Value;

            var updatedDoctor = await _doctorRepository.UpdateDoctorAsync(existingDoctor);
            return updatedDoctor != null;
        }

        public async Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(PaginationParams paginationParams)
        {
            // 1. Lấy danh sách các phân khúc (Tiers)
            var tiers = await _serviceTierRepo.GetActiveTiersAsync();

            var resultList = new List<ServiceTierWithPaginatedDoctorsDto>();

            // 2. Lặp qua từng phân khúc
            foreach (var tier in tiers)
            {
                // 3. Với mỗi phân khúc, gọi repo để lấy bác sĩ đã phân trang
                var (doctors, totalCount) = await _doctorRepository.GetPaginatedDoctorsByTierIdAsync(
                    tier.Id,
                    paginationParams.PageNumber,
                    paginationParams.PageSize);

                // 4. Map Doctor entities sang DoctorDto
                var doctorDtos = doctors.Select(doc => new DoctorBookinDto
                {
                  userId= doc.User.Id,
                    DoctorId= doc.Id,
                    DoctorName = doc.User.FullName,
                    specialization = doc.Specialization.Name,
                    Education = doc.Education,
                    Experience = doc.YearsOfExperience.ToString(),
                    price = doc.ConsultationFee,
                    bio = doc.Bio,
                    rating = doc.AverageRating

                }).ToList();

                // 5. Tạo DTO phân trang cho bác sĩ
                var paginatedDoctors = new PaginatedListDto<DoctorBookinDto>(
                    doctorDtos,
                    paginationParams.PageNumber,
                    paginationParams.PageSize,
                    totalCount);

                // 6. Thêm vào kết quả cuối cùng
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
    }
}
