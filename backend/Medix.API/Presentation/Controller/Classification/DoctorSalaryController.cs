using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorSalaryController : ControllerBase
    {
        private readonly ILogger<DoctorSalaryController> _logger;
        private readonly IDoctorSalaryService _salaryService;

        public DoctorSalaryController(
            IDoctorSalaryService salaryService, 
            ILogger<DoctorSalaryController> logger)
        {
            _salaryService = salaryService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetSalariesOfDoctor()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }

                var userId = Guid.Parse(userIdClaim.Value);

                var salaryList = await _salaryService.GetPaidSalariesByUserIdAsync(userId);
                var list = salaryList.Select(s => new
                {
                    s.Id,
                    s.PeriodStartDate,
                    s.PeriodEndDate,
                    s.TotalAppointments,
                    s.TotalEarnings,
                    s.CommissionDeductions,
                    s.NetSalary,
                    s.PaidAt,
                }).ToList();
                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get salaries of doctor");
                return StatusCode(500);
            }
        }
    }
}
