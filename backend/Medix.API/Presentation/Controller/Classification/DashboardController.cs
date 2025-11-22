using System.Security.Claims;
using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Authorization;
﻿using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Classification;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDoctorDashboardService _service;
        private readonly IAdminDashboardService _adminService;
        private readonly IManagerDashboardService _managerService;

        public DashboardController(IDoctorDashboardService service, IAdminDashboardService adminService, IManagerDashboardService managerService)
        {
            _service = service;
            _adminService = adminService;
            _managerService = managerService;
        private readonly ISpecializationService _specializationService;
        private readonly IAppointmentService appointmentService;
        private readonly IUserService _userService;

        public DashboardController(IDoctorDashboardService service, ISpecializationService specializationService, IAppointmentService appointmentService, IUserService userService)
        {
            _service = service;
            _specializationService = specializationService;
            this.appointmentService = appointmentService;
            _userService = userService;
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetDoctorDashboard(Guid doctorId)
        {
            var result = await _service.GetDashboardAsync(doctorId);
            return Ok(result);
        }

        [HttpGet("specializations/popular")]
        public async Task<IActionResult> GetDoctorCountBySpecialization()
        {
            var distribution = await _specializationService.GetDoctorCountBySpecializationAsync();
            if (distribution == null || !distribution.Any())
                return NoContent();

            return Ok(distribution);
        }
        [HttpGet("user-growth")]
        public async Task<IActionResult> GetUserGrowth([FromQuery] int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            try
            {
                var growth = await _userService.GetUserGrowthAsync(targetYear);
                if (growth == null || growth.Monthly == null || !growth.Monthly.Any())
                    return NoContent();

                return Ok(growth);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while fetching user growth." });
            }
        }
        [HttpGet("appointments/trends")]
        public async Task<IActionResult> GetAppointmentTrends([FromQuery] Guid? doctorId = null, [FromQuery] int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var trends = await appointmentService.GetAppointmentTrendsAsync(doctorId, targetYear);
            return Ok(trends);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var dto = await _userService.GetSummaryAsync();
                return Ok(dto);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error generating dashboard summary." });
            }
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

        [HttpGet("manager")]
        [Authorize(Roles = "Manager,Admin")]
        public async Task<IActionResult> GetManagerDashboard()
        {
            var result = await _managerService.GetDashboardAsync();
            return Ok(result);
        }
    }
}
