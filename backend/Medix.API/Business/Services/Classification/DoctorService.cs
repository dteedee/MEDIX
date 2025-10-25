using Medix.API.DataAccess;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.Entities;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Community;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IEmailService _emailService;
        private readonly MedixContext _context;

        public DoctorService(
            IDoctorRepository doctorRepository,
            IUserRepository userRepository,
            IReviewRepository reviewRepository,
            IEmailService emailService,
            MedixContext context)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _reviewRepository = reviewRepository;
            _emailService = emailService;
            _context = context;
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

        public async Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorProfileQuery query)
        {
            return await _doctorRepository.GetPendingDoctorsAsync(query);
        }

        public async Task ReviewDoctorProfile(DoctorProfileReviewRequest request, Guid doctorId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId) ?? throw new Exception("Doctor not found");
            try
            {
                if (request.IsApproved)
                {
                    var newPassword = PasswordGenerator.Generate();
                    var passwordHashed = BCrypt.Net.BCrypt.HashPassword(newPassword);

                    doctor.User.PasswordHash = passwordHashed;
                    doctor.Education = request.Education;
                    doctor.User.Status = 1; // Active

                    await _doctorRepository.UpdateDoctorAsync(doctor);
                    var emailBody = GetAcceptEmailBody(newPassword, doctor.User.FullName);
                    if (!await _emailService.SendEmailAsync(doctor.User.Email, "Phê duyệt hồ sơ bác sĩ", emailBody))
                    {
                        throw new Exception("Failed to send approval email");
                    }
                }
                else
                {
                    doctor.User.Status = 3; // Rejected
                    await _doctorRepository.UpdateDoctorAsync(doctor);

                    var emailBody = GetRejectEmailBody(request.RejectReason ?? "Không có lý do cụ thể", doctor.User.FullName);
                    if (!await _emailService.SendEmailAsync(doctor.User.Email, "Từ chối hồ sơ bác sĩ", emailBody))
                    {
                        throw new Exception("Failed to send rejection email");
                    }
                }
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Doctor?> GetDoctorByIdAsync(Guid id) => await _doctorRepository.GetDoctorByIdAsync(id);

        public static string GetAcceptEmailBody(string newPassword, string fullName)
        {
            return $@"
                <p>Bác sĩ {fullName} thân mến,</p>
                <p>Hồ sơ bác sĩ của bạn đã được phê duyệt thành công. Chúng tôi rất vui mừng được chào đón bạn đến với nền tảng Medix.</p>

                <p>Vui lòng sử dụng mật khẩu dưới đây để đăng nhập vào hệ thống:</p>

                <div style=""margin: 1em 0; padding: 1em; border-radius: 8px; background-color: #f0f4f8; border: 1px solid #d0d7de; box-shadow: 0 2px 6px rgba(0,0,0,0.05); font-family: 'Segoe UI', sans-serif;"">
                  <label style=""display: block; font-weight: 600; font-size: 1.1em; color: #333; margin-bottom: 0.5em;"">
                    🔐 Mật khẩu đăng nhập:
                  </label>
                  <div style=""display: inline-block; padding: 0.75em 1.5em; font-size: 1.4em; font-weight: bold; color: #2c3e50; background-color: #ffffff; border: 2px solid #4da6ff; border-radius: 6px; letter-spacing: 2px;"">
                    {{newPassword}}
                  </div>
                </div>

                <p>Vui lòng đổi mật khẩu sau khi đăng nhập để đảm bảo bảo mật thông tin cá nhân.</p>
                <p>Trân trọng,<br/>Đội ngũ Medix</p>
            ";
        }


        private static string GetRejectEmailBody(string reason, string fullName)
        {
            return $@"
                <p>Bác sĩ {fullName} thân mến,</p>
                <p>Chúng tôi rất tiếc phải thông báo rằng hồ sơ bác sĩ của bạn chưa được phê duyệt. Sau khi xem xét kỹ lưỡng, chúng tôi nhận thấy hồ sơ của bạn hiện chưa đáp ứng đầy đủ các tiêu chuẩn cần thiết.</p>

                <p><strong>Lý do từ quản lý:</strong> {reason}</p>

                <p>Nếu bạn có bất kỳ thắc mắc nào hoặc không hài lòng với quyết định này, xin vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi. Trong trường hợp bạn muốn thử lại, vui lòng tiến hành đăng ký lại để cập nhật thông tin và hoàn thiện hồ sơ.</p>

                <p>Chân thành cảm ơn sự thông cảm của bạn.</p>
                <p>Trân trọng,<br/>Đội ngũ Medix</p>
            ";
        }
    }
}