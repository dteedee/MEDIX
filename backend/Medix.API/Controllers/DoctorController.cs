using Medix.API.Application.DTOs.Doctor;
using Medix.API.Application.Services;
using Medix.API.Application.Utils;
using Medix.API.Data.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ISpecializationService _specializationService;
        private readonly CloudinaryService _cloudinaryService;

        public DoctorController(IDoctorService doctorService, ISpecializationService specializationService,
            CloudinaryService cloudinaryService)
        {
            _doctorService = doctorService;
            _specializationService = specializationService;
            _cloudinaryService = cloudinaryService;
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
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            User user = new User
            {
                Id = Guid.NewGuid(),
                UserName = request.FullName,
                NormalizedUserName = request.FullName.ToUpper(),
                Email = request.Email,
                NormalizedEmail = request.Email.ToUpper(),
                PasswordHash = request.Password, // In real application, hash the password
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
                YearsOfExperience = request.YearsOfExperience,
                ConsultationFee = 0, // Default fee
            };

            UserRole userRole = new UserRole
            {
                UserId = user.Id,
                RoleCode = "Doctor",
            };

            if (!(await _doctorService.RegisterDoctorAsync(user, doctor, userRole)))
            {
                return BadRequest(new { Message = "Registration failed" });
            }

            return Ok(new { Message = "Doctor registered successfully" });
        }
    }
}
