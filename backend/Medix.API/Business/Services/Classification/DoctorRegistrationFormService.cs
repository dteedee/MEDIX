using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Services.Community;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorRegistrationFormService : IDoctorRegistrationFormService
    {
        private readonly IDoctorRegistrationFormRepository _doctorRegistrationFormRepository;
        private readonly CloudinaryService _cloudinaryService;
        private readonly MedixContext _context;
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IDoctorRepository _doctorRepository;

        public DoctorRegistrationFormService(
            IDoctorRegistrationFormRepository doctorRegistrationFormRepository,
            CloudinaryService cloudinaryService,
            MedixContext context,
            IEmailService emailService,
            IUserRepository userRepository,
            IDoctorRepository doctorRepository)
        {
            _doctorRegistrationFormRepository = doctorRegistrationFormRepository;
            _cloudinaryService = cloudinaryService;
            _context = context;
            _emailService = emailService;
            _userRepository = userRepository;
            _doctorRepository = doctorRepository;
        }

        public async Task<bool> IsUserNameExistAsync(string userName) =>
            await _doctorRegistrationFormRepository.UserNameExistAsync(userName);

        public async Task<bool> IsEmailExistAsync(string email) =>
            await _doctorRegistrationFormRepository.EmailExistAsync(email);

        public async Task<bool> IsPhoneNumberExistAsync(string phoneNumber) =>
            await _doctorRegistrationFormRepository.PhoneNumberExistAsync(phoneNumber);

        public async Task<bool> IsIdentificationNumberExistAsync(string identificationNumber) =>
            await _doctorRegistrationFormRepository.IdentificationNumberExistAsync(identificationNumber);

        public async Task<bool> IsLicenseNumberExistAsync(string licenseNumber) =>
            await _doctorRegistrationFormRepository.LicenseNumberExistAsync(licenseNumber);

        public async Task RegisterDoctorAsync(DoctorRegisterRequest request)
        {
            var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar);
            var licenseImageUrl = await _cloudinaryService.UploadImageAsync(request.LicenseImage);
            var degreeFilesUrl = await _cloudinaryService.UploadArchiveAsync(request.DegreeFiles);
            var identityCardUrl = await _cloudinaryService.UploadImageAsync(request.IdentityCardImage);

            var form = new DoctorRegistrationForm
            {
                AvatarUrl = avatarUrl,
                FullName = request.FullName,
                UserNameNormalized = request.UserName.ToUpper(),
                DateOfBirth = DateOnly.Parse(request.Dob),
                GenderCode = request.GenderCode,
                IdentificationNumber = request.IdentificationNumber,
                IdentityCardImageUrl = identityCardUrl,
                EmailNormalized = request.Email.ToUpper(),
                PhoneNumber = request.PhoneNumber,
                SpecializationId = Guid.Parse(request.SpecializationId),
                LicenseImageUrl = licenseImageUrl,
                LicenseNumber = request.LicenseNumber,
                DegreeFilesUrl = degreeFilesUrl,
                Bio = request.Bio,
                Education = request.Education,
                YearsOfExperience = (int)request.YearsOfExperience,
            };

            await _doctorRegistrationFormRepository.AddAsync(form);
        }

        public async Task<PagedList<DoctorRegistrationForm>> GetAllRegistrationFormsAsync(DoctorQuery query)
            => await _doctorRegistrationFormRepository.GetAllAsync(query);

        public async Task<DoctorRegistrationForm?> GetByIdAsync(Guid id)
            => await _doctorRegistrationFormRepository.GetByIdAsync(id);

        public async Task ReviewDoctorAsync(DoctorReviewRequest request, DoctorRegistrationForm form)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!request.IsApproved)
                {
                    if (!await _doctorRegistrationFormRepository.DeleteAsync(form.Id))
                    {
                        throw new Exception("Failed to delete doctor registration form");
                    }
                    var emailBody = GetRejectEmailBody(request.RejectReason ?? "Không có lý do cụ thể", form.FullName);
                    if (!await _emailService.SendEmailAsync(form.EmailNormalized, "Từ chối hồ sơ bác sĩ", emailBody))
                    {
                        throw new Exception("Failed to send rejection email");
                    }
                }
                else
                {
                    var newPassword = PasswordGenerator.Generate();
                    var passwordHashed = BCrypt.Net.BCrypt.HashPassword(newPassword);

                    var userId = Guid.NewGuid();

                    var user = new User
                    {
                        Id = userId,
                        UserName = form.UserNameNormalized,
                        NormalizedUserName = form.UserNameNormalized.ToUpper(),
                        Email = form.EmailNormalized,
                        NormalizedEmail = form.EmailNormalized.ToUpper(),
                        PasswordHash = passwordHashed,
                        PhoneNumber = form.PhoneNumber,
                        PhoneNumberConfirmed = false,
                        EmailConfirmed = true,
                        FullName = form.FullName,
                        DateOfBirth = form.DateOfBirth,
                        GenderCode = form.GenderCode,
                        IdentificationNumber = form.IdentificationNumber,
                        AvatarUrl = form.AvatarUrl,
                        Status = 1,
                        IsProfileCompleted = true,
                    };
                    await _userRepository.CreateAsync(user);

                    var userRole = new UserRole
                    {
                        UserId = userId,
                        RoleCode = "Doctor",
                    };
                    await _userRepository.CreateUserRoleAsync(userRole);

                    var doctor = new Doctor
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        SpecializationId = form.SpecializationId,
                        ServiceTierId = Guid.Parse("580AACE7-39D4-4BAA-B13F-A98A5CA503B1"), //Basic tier
                        LicenseNumber = form.LicenseNumber,
                        LicenseImageUrl = form.LicenseImageUrl,
                        DegreeFilesUrl = form.DegreeFilesUrl,
                        Bio = form.Bio,
                        Education = request.Education,
                        YearsOfExperience = form.YearsOfExperience,
                        ConsultationFee = 0,
                        AverageRating = 0,
                        TotalReviews = 0,
                        IsVerified = true,
                        IsAcceptingAppointments = false
                    };
                    await _doctorRepository.CreateDoctorAsync(doctor);

                    if (!await _doctorRegistrationFormRepository.DeleteAsync(form.Id))
                    {
                        throw new Exception("Failed to delete doctor registration form");
                    }

                    var emailBody = GetAcceptEmailBody(newPassword, form.FullName);
                    if (!await _emailService.SendEmailAsync(form.EmailNormalized, "Chấp nhận hồ sơ bác sĩ", emailBody))
                    {
                        throw new Exception("Failed to send acceptance email");
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

        private static string GetAcceptEmailBody(string newPassword, string fullName)
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
                    {newPassword}
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
