using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Validators;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
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
        private readonly CloudinaryService _cloudinaryService;
        private readonly IUserService _userSerivce;
        private readonly IMapper _mapper;
        private readonly ILogger<DoctorController> _logger;

        public DoctorController(IDoctorService doctorService,
            CloudinaryService cloudinaryService, IUserService userService, IMapper mapper,
            ILogger<DoctorController> logger)
        {
            _doctorService = doctorService;
            _cloudinaryService = cloudinaryService;
            _userSerivce = userService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet("education-type")]
        public async Task<IActionResult> GetEducationTypes()
        {
            try
            {
                var educationTypes = DoctorDegree.List()
                    .Select(degree => new
                    {
                        Code = degree.Code,
                        Description = degree.Description
                    }).ToList();
                return Ok(educationTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching education types.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("profile/{doctorID}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDoctorProfile(string doctorID)
        {
            try
            {
                var profileDto = await _doctorService.GetDoctorProfileByDoctorIDAsync(doctorID);

                if (profileDto == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                return Ok(profileDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching doctor profile for username: {Username}", doctorID);
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

                _logger.LogInformation($"userId: {userId}");
                var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userId.Value));
                if (doctor == null)
                {
                    _logger.LogInformation("eror be here");
                    return NotFound(new { Message = "Doctor not found" });
                }

                return Ok(new
                {
                    doctor.User.AvatarUrl,
                    UserName = doctor.User.UserName.ToLower(),
                    doctor.User.FullName,
                    Email = doctor.User.Email.ToLower(),
                    doctor.User.PhoneNumber,
                    doctor.User.Address,
                    Dob = doctor.User.DateOfBirth?.ToDateTime(TimeOnly.MinValue).ToString("dd/MM/yyyy"),
                    doctor.User.IdentificationNumber,
                    doctor.User.GenderCode,
                    Specialization = doctor.Specialization.Name,
                    doctor.LicenseNumber,
                    Education = DoctorDegree.GetDescription(doctor.Education),
                    ServiceTier = doctor.ServiceTier?.Name,
                    doctor.YearsOfExperience,
                    doctor.Bio,
                    doctor.LicenseImageUrl,
                    doctor.DegreeFilesUrl,
                    doctor.StartDateBanned,
                    doctor.EndDateBanned,
                    doctor.TotalBanned,
                    doctor.TotalCaseMissPerWeek,
                    doctor.isSalaryDeduction,
                    doctor.NextWeekMiss,
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
        public async Task<IActionResult> UpdateDoctorProfile([FromBody] DoctorProfileUpdatePresenter pre)
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

                var request = _mapper.Map<DoctorProfileUpdateRequest>(pre);
                var validationResults = new List<ValidationResult>();
                var context = new ValidationContext(request, null, null);

                Validator.TryValidateObject(request, context, validationResults, true);
                validationResults = await ValidateUpdateRequest(validationResults, request, doctor);

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

        [HttpGet]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetDoctors([FromQuery] DoctorQuery query)
        {
            try
            {
                var doctors = await _doctorService.GetDoctorsAsync(query);
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching doctors.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetDoctorById(Guid id)
        {
            try
            {
                var doctor = await _doctorService.GetDoctorByIdAsync(id);
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }
                var doctorDto = new
                {
                    doctor.Id,
                    doctor.User.AvatarUrl,
                    doctor.User.FullName,
                    Email = doctor.User.Email.ToLower(),
                    doctor.User.PhoneNumber,
                    Specialization = doctor.Specialization.Name,
                    doctor.Education,
                    doctor.YearsOfExperience,
                    Rating = doctor.Appointments
                        .Where(a => a.Review != null)
                        .Select(a => a.Review.Rating)
                        .DefaultIfEmpty(0)
                        .Average(),
                    ReviewCount = doctor.Appointments
                        .Count(a => a.Review != null),
                    StatusCode = doctor.User.Status,
                    doctor.CreatedAt,
                    ServiceTier = doctor.ServiceTier?.Name,
                    Price = doctor.ConsultationFee,
                    doctor.LicenseNumber,
                    doctor.LicenseImageUrl,
                    doctor.DegreeFilesUrl,
                    doctor.Bio,
                };
                return Ok(doctorDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching doctor by ID.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("{id}/statistics")]
     
        public async Task<IActionResult> GetStatistic(Guid id)
        {
            try
            {
                var doctor = await _doctorService.GetDoctorByIdAsync(id);
                if (doctor == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }
                var statistic = new
                {
                    doctor.Id,
                    TotalBookings = doctor.Appointments
                        .Select(a => a.PatientId)
                        .Distinct()
                        .Count(),
                    SuccessfulAppointments = doctor.Appointments
                        .Where(a => Constants.SuccessfulAppointmentStatusCode.Contains(a.StatusCode))
                        .Count(),
                    TotalCases = doctor.Appointments.Count,
                    SuccessfulCases = doctor.Appointments
                        .Where(a => a.StatusCode == Constants.CompletedAppointmentStatusCode)
                        .Count(),
                    Revenue = doctor.Appointments
                        .Select(a => a.TotalAmount)
                        .Sum(),
                };
                return Ok(statistic);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while fetching doctor statistic with Id = {id}.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var query = new DoctorQuery
                {
                    Page = 1,
                    PageSize = 0,
                    SearchTerm = ""
                };
                var doctors = await _doctorService.GetDoctorsAsync(query);
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while fetching all doctors");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        private List<ValidationResult> ValidateNewPassword(List<ValidationResult> prevResult, PasswordUpdateRequest req, string oldPassword)
        {
            if (req.NewPassword == oldPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu mới không được trùng với mật khẩu hiện tại", new string[] { "NewPassword" }));
            }

            if (req.NewPassword != req.ConfirmPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu không khớp", new string[] { "ConfirmNewPassword" }));
            }

            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, oldPassword))
            {
                prevResult.Add(new ValidationResult("Mật khẩu cũ không đúng", new string[] { "CurrentPassword" }));
            }
            return prevResult;
        }

        private async Task<List<ValidationResult>> ValidateUpdateRequest(List<ValidationResult> prevResult, DoctorProfileUpdateRequest request
            , Doctor doctor)
        {
            if (request.PhoneNumber != null
                && request.PhoneNumber != doctor.User.PhoneNumber
                && await _userSerivce.PhoneNumberExistsAsync(request.PhoneNumber))
            {
                prevResult.Add(new ValidationResult("Số điện thoại đã được sử dụng", new[] { "PhoneNumber" }));
            }

            if (request.UserName != null
                && request.UserName != doctor.User.UserName
                && await _userSerivce.UserNameExistsAsync(request.UserName))
            {
                prevResult.Add(new ValidationResult("Tên đăng nhập đã được sử dụng", new[] { "UserName" }));
            }

            return prevResult;
        }
    }

    public class UpdateAvatarRequest
    {
        [RequiredImage(MaxSizeInMB = 1)]
        public IFormFile? Avatar { get; set; }
    }
}
