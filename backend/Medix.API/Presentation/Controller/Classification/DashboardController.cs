using System.Security.Claims;
using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDoctorDashboardService _service;
        private readonly IAdminDashboardService _adminService;

        public DashboardController(IDoctorDashboardService service, IAdminDashboardService adminService)
        {
            _service = service;
            _adminService = adminService;
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetDoctorDashboard(Guid doctorId)
        {
            var result = await _service.GetDashboardAsync(doctorId);
            return Ok(result);
        }
        [HttpGet("doctor")]
        public async Task<IActionResult> GetMyDashboard()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("Không thể xác định người dùng.");

            var result = await _service.GetDashboardByUserIdAsync(userId);
            if (result == null)
                return NotFound("Không tìm thấy dashboard cho bác sĩ này.");

            return Ok(result);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var result = await _adminService.GetDashboardAsync();
            return Ok(result);
        }
    }
}
