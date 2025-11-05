using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


namespace Medix.API.Presentation.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
    

        public BookingController(IDoctorService doctorService)
        {
            _doctorService = doctorService;

        }

        // Controllers/DoctorGroupsController.cs (hoặc BookingController)

        [HttpGet("by-tier")]
        [ProducesResponseType(typeof(IEnumerable<ServiceTierWithPaginatedDoctorsDto>), 200)]
        public async Task<IActionResult> GetDoctorsGroupedByTier(
            // THAY ĐỔI Ở ĐÂY:
            [FromQuery] DoctorQueryParameters queryParams)
        {
            // Truyền tham số MỚI vào service
            var result = await _doctorService.GetGroupedDoctorsAsync(queryParams);
            return Ok(result);
        }

        [HttpGet("grouped-by-education")]
        public async Task<IActionResult> GetDoctorsGroupedByEducation([FromQuery] DoctorQueryParameters queryParams)
        {
            try
            {
                var groupedDoctors = await _doctorService.GetDoctorsByEducationAsync(queryParams);
                return Ok(groupedDoctors);
            }
            catch (Exception ex)
            {
              
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

    }
}
