using System.Security.Claims;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientController : ControllerBase
    {

        private readonly IPatientService _patientService;
        private readonly CloudinaryService _cloudinaryService;
        private readonly MedixContext _context;
        public PatientController(IPatientService patientService, CloudinaryService cloudinaryService, MedixContext context)
        {
            _patientService = patientService;
            _cloudinaryService = cloudinaryService;
            _context = context;
        }

        [HttpPost("uploadAvatar")]
        public async Task<ActionResult> UploadAvatar(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                // Generate a unique file name using the uploaded file's name
                var fileName = Guid.NewGuid().ToString() + "_" + file.FileName;

                // Pass the file stream and the generated file name to the UploadImageAsync method
                using var stream = file.OpenReadStream();
                var uploadResult = await _cloudinaryService.UploadImageAsync(stream, fileName);

                if (uploadResult == null)
                    return StatusCode(500, new { message = "Image upload failed" });

                return Ok(new { imageUrl = uploadResult });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading image", error = ex.Message });
            }
        }

   
        [HttpGet("getPatientByUserId")]
        [Authorize(Roles = "Patient")]
        public async Task<ActionResult> GetPatientByUserId()
        {
            try
            {
                // Lấy userId từ JWT claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                    return Unauthorized(new { message = "User ID not found in token" });

                if (!Guid.TryParse(userIdClaim.Value, out var userId))
                    return Unauthorized(new { message = "Invalid user ID in token" });

                var patient = await _patientService.GetByUserIdAsync(userId);
                if (patient == null)
                    return NotFound(new { message = "Patient not found" });

                return Ok(patient);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving patient", error = ex.Message });
            }
        }
    }
}
