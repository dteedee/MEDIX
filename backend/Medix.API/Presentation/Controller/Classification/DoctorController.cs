using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Mvc;

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

        public DoctorController(IDoctorService doctorService, ISpecializationService specializationService,
            CloudinaryService cloudinaryService, IUserService userService)
        {
            _doctorService = doctorService;
            _specializationService = specializationService;
            _cloudinaryService = cloudinaryService;
            _userSerivce = userService;
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
        public async Task<IActionResult> RegisterDoctor([FromForm] DoctorRegisterRequest request)
        {
            await ValidateAsync(request);
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
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

        private async Task ValidateAsync(DoctorRegisterRequest request)
        {
            if (await _userSerivce.EmailExistsAsync(request.Email))
            {
                ModelState.AddModelError("Email", "Email đã được sử dụng");
            }

            if (await _userSerivce.PhoneNumberExistsAsync(request.PhoneNumber))
            {
                ModelState.AddModelError("PhoneNumber", "Số điện thoại đã được sử dụng");
            }

            if (await _doctorService.LicenseNumberExistsAsync(request.LicenseNumber))
            {
                ModelState.AddModelError("LicenseNumber", "Số giấy phép hành nghề đã được sử dụng");
            }

            if (await _userSerivce.UserNameExistsAsync(request.UserName))
            {
                ModelState.AddModelError("UserName", "Tên đăng nhập đã được sử dụng");
            }

            if (await _userSerivce.IdentificationNumberExistsAsync(request.IdentificationNumber))
            {
                ModelState.AddModelError("IdentificationNumber", "Số CCCD/CMND đã được sử dụng");
            }
        }

        [HttpGet("profile/{username}")]
        public async Task<IActionResult> GetDoctorProfile(string username)
        {
            var profileDto = await _doctorService.GetDoctorProfileByUserNameAsync(username);

            if (profileDto == null)
            {
                return NotFound(new { Message = "Doctor not found" });
            }

            return Ok(profileDto);
        }
    }
}
