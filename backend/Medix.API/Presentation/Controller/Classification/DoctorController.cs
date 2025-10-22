using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Validators;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Org.BouncyCastle.Ocsp;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ISpecializationService _specializationService;
        private readonly CloudinaryService _cloudinaryService;
        private readonly IUserService _userSerivce;
        private readonly IMapper _mapper;
        private readonly ILogger<DoctorController> _logger;

        public DoctorController(IDoctorService doctorService, ISpecializationService specializationService,
            CloudinaryService cloudinaryService, IUserService userService, IMapper mapper,
            ILogger<DoctorController> logger)
        {
            _doctorService = doctorService;
            _specializationService = specializationService;
            _cloudinaryService = cloudinaryService;
            _userSerivce = userService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet("register-metadata")]
        public async Task<IActionResult> Get()
        {
            try
            {
                var specializations = await _specializationService.GetAllSpecializationsAsync();
                var response = new DoctorRegisterMetadataDto
                {
                    Specializations = specializations.Select(s => new SpecializationDto
                    {
                        Id = s.Id,
                        Name = s.Name
                    }).ToList()
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching registration metadata.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }

        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterDoctor([FromForm] DoctorRegisterPresenter presenter)
        {
            try
            {
                var request = _mapper.Map<DoctorRegisterRequest>(presenter);
                var validationResults = new List<ValidationResult>();
                var context = new ValidationContext(request, null, null);

                Validator.TryValidateObject(request, context, validationResults, true);
                validationResults = await ValidateAsync(request, validationResults);
                if (validationResults.Count != 0)
                {
                    var modelState = new ModelStateDictionary();
                    foreach (var validationResult in validationResults)
                    {
                        foreach (var memberName in validationResult.MemberNames)
                        {
                            modelState.AddModelError(memberName, validationResult.ErrorMessage ?? "Invalid value");
                        }
                    }
                    return ValidationProblem(modelState);
                }

                User user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = request.UserName,
                    NormalizedUserName = request.UserName.ToUpper(),
                    Email = request.Email,
                    NormalizedEmail = request.Email.ToUpper(),
                    PasswordHash = "", // Password will be set later
                    PhoneNumber = request.PhoneNumber,
                    PhoneNumberConfirmed = false,
                    EmailConfirmed = false,
                    FullName = request.FullName,
                    DateOfBirth = request.Dob == null ? null : DateOnly.Parse(request.Dob),
                    GenderCode = request.GenderCode,
                    IdentificationNumber = request.IdentificationNumber,
                    AvatarUrl = "https://res.cloudinary.com/dvyswwdcz/image/upload/v1760970670/default_avatar_cnnmzg.jpg", // Default avatar
                    Status = 2, // Assuming 2 means pending verification
                };

                var licenseImageUrl = await _cloudinaryService.UploadArchiveAsync(request.LicenseImage);

                Doctor doctor = new Doctor
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    SpecializationId = Guid.Parse("247CAA7D-7FF2-4404-9A92-BCDF9C595290"), // Default specialization
                    LicenseNumber = request.LicenseNumber,
                    LicenseImageUrl = licenseImageUrl != null ? licenseImageUrl : "",
                    Bio = request.Bio,
                    Education = request.Education,
                    YearsOfExperience = (int)request.YearsOfExperience,
                    ConsultationFee = 0, // Default fee
                };

                UserRole userRole = new UserRole
                {
                    UserId = user.Id,
                    RoleCode = "Doctor",
                };

                if (!await _doctorService.RegisterDoctorAsync(user, doctor, userRole))
                {
                    return StatusCode(500, new { Message = "Registration failed" });
                }

                return Ok(new { Message = "Doctor registered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while registering a doctor.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        private async Task<List<ValidationResult>> ValidateAsync(DoctorRegisterRequest request, List<ValidationResult> prev)
        {
            if (request.Email != null && await _userSerivce.EmailExistsAsync(request.Email))
            {
                prev.Add(new ValidationResult("Email đã được sử dụng", new[] { "Email" }));
            }

            if (request.PhoneNumber != null && await _userSerivce.PhoneNumberExistsAsync(request.PhoneNumber))
            {
                prev.Add(new ValidationResult("Số điện thoại đã được sử dụng", new[] { "PhoneNumber" }));
            }

            if (request.LicenseNumber != null && await _doctorService.LicenseNumberExistsAsync(request.LicenseNumber))
            {
                prev.Add(new ValidationResult("Số giấy phép hành nghề đã được sử dụng", new[] { "LicenseNumber" }));
            }

            if (request.UserName != null && await _userSerivce.UserNameExistsAsync(request.UserName))
            {
                prev.Add(new ValidationResult("Tên đăng nhập đã được sử dụng", new[] { "UserName" }));
            }

            if (request.IdentificationNumber != null && await _userSerivce.IdentificationNumberExistsAsync(request.IdentificationNumber))
            {
                prev.Add(new ValidationResult("Số CCCD/CMND đã được sử dụng", new[] { "IdentificationNumber" }));
            }

            return prev;
        }

        [HttpGet("profile/{username}")]
        public async Task<IActionResult> GetDoctorProfile(string username)
        {
            try
            {
                var profileDto = await _doctorService.GetDoctorProfileByUserNameAsync(username);

                if (profileDto == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                return Ok(profileDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching doctor profile for username: {Username}", username);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("profile/details")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetDoctorProfilesDetails()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userId == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }

                var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userId.Value));
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                return Ok(new
                {
                    doctor.User.UserName,
                    doctor.User.Email,
                    doctor.User.AvatarUrl,
                    doctor.User.PhoneNumber,
                    doctor.User.FullName,
                    doctor.User.DateOfBirth,
                    doctor.User.Address,
                    doctor.Education,
                    doctor.Bio,
                    doctor.YearsOfExperience,
                    doctor.ConsultationFee,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching doctor profile details.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpPut("profile/update")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdateDoctorProfile([FromBody] DoctorProfileUpdateRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userId == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userId.Value));
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                var result = await _doctorService.UpdateDoctorProfileAsync(doctor, request);
                if (!result)
                {
                    return StatusCode(500, new { Message = "An error occurred while updating the profile" });
                }
                return Ok(new { Message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating doctor profile.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpPut("profile/update-avatar")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdateDoctorAvatar([FromForm] UpdateAvatarRequest req)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userId == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userId.Value));
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }
                var avatarUrl = await _cloudinaryService.UploadImageAsync(req.Avatar);
                if (avatarUrl == null)
                {
                    return StatusCode(500, new { Message = "Failed to upload avatar image" });
                }
                doctor.User.AvatarUrl = avatarUrl;
                var updatedUser = await _userSerivce.UpdateUserAsync(doctor.User);
                if (updatedUser == null)
                {
                    return StatusCode(500, new { Message = "An error occurred while updating the avatar" });
                }
                return Ok(new { Message = "Avatar updated successfully", AvatarUrl = avatarUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating doctor avatar.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpPut("profile/update-password")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdateDoctorPassword([FromBody] PasswordUpdatePresenter pre)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userId == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userId.Value));
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                var req = _mapper.Map<PasswordUpdateRequest>(pre);
                var validationResults = new List<ValidationResult>();
                var context = new ValidationContext(req, null, null);

                Validator.TryValidateObject(req, context, validationResults, true);
                ValidateNewPassword(validationResults, req, doctor.User.PasswordHash);
                if (validationResults.Any())
                {
                    return BadRequest(validationResults);
                }

                Console.WriteLine(doctor.User.PasswordHash);
                Console.WriteLine(req.NewPassword);
                doctor.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
                var updatedUser = await _userSerivce.UpdateUserAsync(doctor.User);
                if (updatedUser == null)
                {
                    return StatusCode(500, new { Message = "An error occurred while updating the password" });
                }

                return Ok(new { Message = "Password updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating doctor password.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        private List<ValidationResult> ValidateNewPassword(List<ValidationResult> prevResult, PasswordUpdateRequest req, string oldPassword)
        {
            if (req.NewPassword == oldPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu mới không được trùng với mật khẩu hiện tại", new[] { "NewPassword" }));
            }

            if (req.NewPassword != req.ConfirmNewPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu không khớp", new[] { "ConfirmNewPassword" }));
            }

            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, oldPassword))
            {
                prevResult.Add(new ValidationResult("Mật khẩu cũ không đúng", new[] { "CurrentPassword" }));
            }
            return prevResult;
        }
    }

    public class UpdateAvatarRequest
    {
        [ImageFile]
        public IFormFile? Avatar { get; set; }
    }
}
