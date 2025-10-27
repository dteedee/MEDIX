using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorProfileController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ILogger<DoctorProfileController> _logger;

        public DoctorProfileController(IDoctorService doctorService,
            ILogger<DoctorProfileController> logger)
        {
            _doctorService = doctorService;
            _logger = logger;
        }

        //[HttpGet]
        //[Authorize(Roles = "Manager")]
        //public async Task<IActionResult> GetPendingDoctorsAsync([FromQuery] DoctorProfileQuery query)
        //{
        //    try
        //    {
        //        var doctorsProfileList = await _doctorService.GetPendingDoctorsAsync(query);
        //        var doctors = doctorsProfileList.Items.Select(d => new
        //        {
        //            d.Id,
        //            d.User.FullName,
        //            d.User.Email,
        //            Specialization = d.Specialization.Name,
        //            CreatedAt = d.CreatedAt.ToString("dd/MM/yyyy"),
        //        }).ToList();
        //        return Ok(new { totalPages = doctorsProfileList.TotalPages, doctors });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error retrieving pending doctors");
        //        return StatusCode(500, "Internal server error");
        //    }
        //}

        //[HttpPut("review/{doctorId}")]
        //public async Task<IActionResult> DoctorProfileReviewController(
        //    [FromBody] DoctorProfileReviewRequest request,
        //    [FromRoute] Guid doctorId)
        //{
        //    try
        //    {
        //        if (request.IsApproved && string.IsNullOrWhiteSpace(request.Education))
        //        {
        //            return BadRequest(new { acceptError = "Chọn trình độ học vấn khi phê duyệt hồ sơ bác sĩ" });
        //        }

        //        if (!request.IsApproved && string.IsNullOrWhiteSpace(request.RejectReason))
        //        {
        //            return BadRequest(new { rejectError = "Vui lòng nhập lí do từ chối" });
        //        }

        //        await _doctorService.ReviewDoctorProfile(request, doctorId);
        //        return Ok();
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error reviewing doctor profile");
        //        return StatusCode(500, "Internal server error");
        //    }
        //}

        //[HttpGet("{doctorId}")]
        //public async Task<IActionResult> GetDoctorProfileById([FromRoute] Guid doctorId)
        //{
        //    try
        //    {
        //        var doctor = await _doctorService.GetDoctorByIdAsync(doctorId);
        //        if (doctor == null)
        //        {
        //            return NotFound("Doctor not found");
        //        }
        //        if (doctor.User.Status != 2)
        //        {
        //            return BadRequest("Doctor profile is not at pending");
        //        }

        //        var doctorProfile = new
        //        {
        //            doctor.User.FullName,
        //            doctor.User.UserName,
        //            Dob = doctor.User.DateOfBirth.HasValue
        //                ? doctor.User.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue).ToString("dd/MM/yyyy")
        //                : string.Empty,
        //            Gender = doctor.User.GenderCode,
        //            doctor.User.IdentificationNumber,
        //            doctor.User.Email,
        //            doctor.User.PhoneNumber,
        //            Specialization = doctor.Specialization.Name,
        //            licenseUrl = doctor.LicenseImageUrl,
        //            doctor.LicenseNumber,
        //            doctor.Bio,
        //            doctor.Education,
        //            doctor.YearsOfExperience
        //        };
        //        return Ok(doctorProfile);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error retrieving doctor profile");
        //        return StatusCode(500, "Internal server error");
        //    }
        //}
    }
}
