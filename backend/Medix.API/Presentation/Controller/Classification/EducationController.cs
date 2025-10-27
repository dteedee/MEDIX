using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class EducationController : ControllerBase
    {
        private readonly ILogger<EducationController> _logger;
        public EducationController(ILogger<EducationController> logger)
        {
            _logger = logger;
        }

        [HttpGet("doctor-degrees")]
        public IActionResult GetDoctorDegrees()
        {
            try
            {
                var degrees = Models.Enums.DoctorDegree.List()
                    .Select(d => new { d.Code, d.Description })
                    .ToList();
                return Ok(degrees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving doctor degrees");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
