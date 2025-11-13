using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientHealthReminderController : ControllerBase
    {
        private readonly IPatientHealthReminderService _patientHealthReminderService;
    

        private readonly IPatientService patientService;

      

        public PatientHealthReminderController(IPatientHealthReminderService patientHealthReminderService, IPatientService patientService)
        {
            _patientHealthReminderService = patientHealthReminderService;
            this.patientService = patientService;
        }

        [HttpGet("getReminder")]
        [Authorize(Roles = "Patient,Doctor")]
        
        public async Task<IActionResult> GetRemindersWithPatientID([FromQuery]string code)
        {

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });
            var patientId = await patientService.GetByUserIdAsync(userId);

            var reminders = await _patientHealthReminderService.getReminderswithPatientID(patientId.Id, code);
            return Ok(reminders);
        }

    }
}
