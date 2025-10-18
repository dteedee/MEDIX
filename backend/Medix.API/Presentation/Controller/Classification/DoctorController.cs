using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Org.BouncyCastle.Ocsp;
using System.ComponentModel.DataAnnotations;

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

        public DoctorController(IDoctorService doctorService, ISpecializationService specializationService,
            CloudinaryService cloudinaryService, IUserService userService, IMapper mapper)
        {
            _doctorService = doctorService;
            _specializationService = specializationService;
            _cloudinaryService = cloudinaryService;
            _userSerivce = userService;
            _mapper = mapper;
        }

        [HttpGet("register-metadata")]
        public async Task<IActionResult> Get()
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

        [HttpPost("register")]
        public async Task<IActionResult> RegisterDoctor([FromForm] DoctorRegisterPresenter presenter)
        {
            var request = _mapper.Map<DoctorRegisterRequest>(presenter);
            var validationResults = new List<ValidationResult>();
            var context = new ValidationContext(request, null, null);

            Validator.TryValidateObject(request, context, validationResults, true);
            validationResults = await ValidateAsync(request, validationResults);
            if (validationResults.Any())
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
                Address = "", // Placeholder
                Status = 2, // Assuming 2 means pending verification
            };

            var licenseImageUrl = await _cloudinaryService.UploadImageAsync(request.LicenseImage);

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
                return BadRequest(new { Message = "Registration failed" });
            }

            return Ok(new { Message = "Doctor registered successfully" });
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
    }
}
