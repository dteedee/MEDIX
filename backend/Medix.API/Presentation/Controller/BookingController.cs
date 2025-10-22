using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Medix.API.Models.DTOs.DoctorBookinDto;

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

        [HttpGet("by-tier")]
        // Cập nhật kiểu trả về
        [ProducesResponseType(typeof(IEnumerable<ServiceTierWithPaginatedDoctorsDto>), 200)]
        public async Task<IActionResult> GetDoctorsGroupedByTier(
        [FromQuery] PaginationParams paginationParams) // <-- Nhận tham số
        {
            // Truyền tham số vào service
            var result = await _doctorService.GetGroupedDoctorsAsync(paginationParams);
            return Ok(result);
        }
    }
}
