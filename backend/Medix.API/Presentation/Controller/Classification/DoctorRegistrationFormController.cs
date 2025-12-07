using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorRegistrationFormController : ControllerBase
    {
        private readonly ISpecializationService _specializationService;
        private readonly ILogger<DoctorRegistrationFormController> _logger;
        private readonly IMapper _mapper;
        private readonly IDoctorRegistrationFormService _doctorRegistrationFormService;
        private readonly IUserService _userSerivce;
        private readonly IDoctorService _doctorService;

        public DoctorRegistrationFormController(
            ISpecializationService specializationService,
            ILogger<DoctorRegistrationFormController> logger,
            IMapper mapper,
            IDoctorRegistrationFormService doctorRegistrationFormService,
            IUserService userSerivce,
            IDoctorService doctorService)
        {
            _specializationService = specializationService;
            _logger = logger;
            _mapper = mapper;
            _doctorRegistrationFormService = doctorRegistrationFormService;
            _userSerivce = userSerivce;
            _doctorService = doctorService;
        }

        [HttpGet("register-metadata")]
        public async Task<IActionResult> GetRegisterMetadata()
        {
            try
            {
                var specializations = await _specializationService.GetAllSpecializationsAsync();
                var response = new DoctorRegisterMetadataDto
                {
                    Specializations = specializations
                        .Where(s => s.IsActive)
                        .Select(s => new SpecializationDto
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
                validationResults = await ValidateRegisterRequestAsync(request, validationResults);
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

                await _doctorRegistrationFormService.RegisterDoctorAsync(request);

                return Ok(new { Message = "Doctor registered successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while registering the doctor.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        private async Task<List<ValidationResult>> ValidateRegisterRequestAsync(DoctorRegisterRequest request, List<ValidationResult> prev)
        {
            if (request.UserName != null && (
                    await _userSerivce.UserNameExistsAsync(request.UserName)
                    || await _doctorRegistrationFormService.IsUserNameExistAsync(request.UserName)
                ))
            {
                prev.Add(new ValidationResult("Tên đăng nhập đã được sử dụng", ["UserName"]));
            }

            if (request.Email != null && (
                    await _userSerivce.EmailExistsAsync(request.Email)
                    || await _doctorRegistrationFormService.IsEmailExistAsync(request.Email)
                ))
            {
                prev.Add(new ValidationResult("Email đã được sử dụng", ["Email"]));
            }

            if (request.PhoneNumber != null && (
                    await _userSerivce.PhoneNumberExistsAsync(request.PhoneNumber)
                    || await _doctorRegistrationFormService.IsPhoneNumberExistAsync(request.PhoneNumber)
                ))
            {
                prev.Add(new ValidationResult("Số điện thoại đã được sử dụng", ["PhoneNumber"]));
            }

            if (request.IdentificationNumber != null && (
                    await _userSerivce.IdentificationNumberExistsAsync(request.IdentificationNumber)
                    || await _doctorRegistrationFormService.IsIdentificationNumberExistAsync(request.IdentificationNumber)
                ))
            {
                prev.Add(new ValidationResult("Số CCCD đã được sử dụng", ["IdentificationNumber"]));
            }

            if (request.LicenseNumber != null && (
                await _doctorService.LicenseNumberExistsAsync(request.LicenseNumber) ||
                await _doctorRegistrationFormService.IsLicenseNumberExistAsync(request.LicenseNumber)
                ))
            {
                prev.Add(new ValidationResult("Số giấy phép hành nghề đã được sử dụng", ["LicenseNumber"]));
            }

            if (request.IdentityCardImages == null || request.IdentityCardImages.Count != 2)
            {
                prev.Add(new ValidationResult("Bạn phải tải lên đúng 2 ảnh CMND/CCCD (mặt trước và mặt sau).",
                    ["IdentityCardImage"]));
            }
            else
            {
                var validFiles = request.IdentityCardImages.Where(f => f != null && f.Length > 0).ToList();

                if (validFiles.Count != 2)
                {
                    prev.Add(new ValidationResult("Cả hai ảnh CMND/CCCD phải hợp lệ.", ["IdentityCardImage"]));
                }
                else
                {
                    var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };

                    foreach (var file in validFiles)
                    {
                        if (!allowedTypes.Contains(file!.ContentType.ToLower()))
                        {
                            prev.Add(new ValidationResult(
                                $"File {file.FileName} không phải là ảnh hợp lệ.",
                                ["IdentityCardImage"]));
                        }

                        const long maxSize = 1 * 1024 * 1024; 
                        if (file.Length > maxSize)
                        {
                            prev.Add(new ValidationResult(
                                $"File {file.FileName} vượt quá dung lượng cho phép (≤ 1MB).",
                                ["IdentityCardImage"]));
                        }
                    }
                }
            }

            // Validate DegreeFiles
            if (request.DegreeFiles != null && request.DegreeFiles.Length > 0)
            {
                const long maxDegreeFileSize = 5 * 1024 * 1024; // 5MB max
                if (request.DegreeFiles.Length > maxDegreeFileSize)
                {
                    prev.Add(new ValidationResult(
                        $"File bằng cấp vượt quá dung lượng cho phép (≤ 5MB). Kích thước hiện tại: {FormatFileSize(request.DegreeFiles.Length)}",
                        ["DegreeFiles"]));
                }
            }

            return prev;
        }

        [HttpGet]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> Get([FromQuery] DoctorQuery query)
        {
            try
            {
                var list = await _doctorRegistrationFormService.GetAllRegistrationFormsAsync(query);
                var doctors = list.Items.Select(d => new
                {
                    d.Id,
                    d.FullName,
                    Email = d.EmailNormalized.ToLower(),
                    Specialization = d.Specialization.Name,
                    d.AvatarUrl,
                    d.CreatedAt
                }).ToList();

                return Ok(new { totalPages = list.TotalPages, doctors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching registration forms.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var registerForm = await _doctorRegistrationFormService.GetByIdAsync(id);

                if (registerForm == null)
                {
                    return NotFound(new { Message = "Doctor registration form not found." });
                }

                var doctor = new
                {
                    registerForm.Id,
                    registerForm.AvatarUrl,
                    registerForm.FullName,
                    UserName = registerForm.UserNameNormalized.ToLower(),
                    Dob = registerForm.DateOfBirth.ToDateTime(TimeOnly.MinValue),
                    Gender = registerForm.GenderCode,
                    registerForm.IdentificationNumber,
                    registerForm.IdentityCardImageUrl,
                    Email = registerForm.EmailNormalized.ToLower(),
                    registerForm.PhoneNumber,
                    Specialization = registerForm.Specialization.Name,
                    registerForm.LicenseImageUrl,
                    registerForm.LicenseNumber,
                    registerForm.DegreeFilesUrl,
                    registerForm.Bio,
                    registerForm.Education,
                    registerForm.YearsOfExperience,
                    registerForm.CreatedAt,
                };

                return Ok(doctor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching the registration form.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpPost("review/{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ReviewRegisterForm(
            [FromBody] DoctorReviewRequest request,
            [FromRoute] Guid id)
        {
            try
            {
                var registerForm = await _doctorRegistrationFormService.GetByIdAsync(id);
                if (registerForm == null)
                {
                    return NotFound(new { Message = "Doctor registration form not found." });
                }

                if (request.IsApproved && string.IsNullOrWhiteSpace(request.Education))
                {
                    return BadRequest(new { acceptError = "Chọn trình độ học vấn khi phê duyệt hồ sơ bác sĩ" });
                }

                if (!request.IsApproved && string.IsNullOrWhiteSpace(request.RejectReason))
                {
                    return BadRequest(new { rejectError = "Vui lòng nhập lí do từ chối" });
                }

                await _doctorRegistrationFormService.ReviewDoctorAsync(request, registerForm);
                
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while reviewing the registration form.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }
    }
}
