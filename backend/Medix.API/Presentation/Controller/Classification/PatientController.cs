using Medix.API.Business.Interfaces.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly ILogger<PatientController> _logger;
        private readonly IPatientService _patientService;

        public PatientController(ILogger<PatientController> logger, IPatientService patientService)
        {
            _logger = logger;
            _patientService = patientService;
        }

        [HttpGet("basicEMRinfo")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetBasicEMRInfo()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }

                var userId = Guid.Parse(userIdClaim.Value);
                var patient = await _patientService.GetPatientByUserIdAsync(userId);
                if (patient == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    patient.Id,
                    patient.User.AvatarUrl,
                    patient.User.FullName,
                    patient.User.IdentificationNumber,
                    patient.User.Address,
                    Email = patient.User.Email.ToLower(),
                    patient.User.PhoneNumber,
                    patient.EmergencyContactName,
                    patient.EmergencyContactPhone,
                    Dob = patient.User.DateOfBirth?.ToDateTime(TimeOnly.MinValue).ToString("dd/MM/yyyy"),
                    patient.User.GenderCode,
                    patient.BloodTypeCode,
                    patient.Allergies
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get basic patient info");
                return StatusCode(500);
            }
        }
    }
}
