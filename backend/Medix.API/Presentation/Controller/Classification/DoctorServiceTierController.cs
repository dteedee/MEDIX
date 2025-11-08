using Medix.API.Business.Interfaces.Classification;
using Medix.API.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorServiceTierController : ControllerBase
    {
        private ILogger<DoctorServiceTierController> _logger;
        private readonly IDoctorServiceTierService _doctorServiceTierService;

        public DoctorServiceTierController(
            IDoctorServiceTierService serviceTierService,
            ILogger<DoctorServiceTierController> logger)
        {
            _doctorServiceTierService = serviceTierService;
            _logger = logger;
        }

        [HttpGet("list")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetDisplayedServiceTier()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var userId = Guid.Parse(userIdClaim.Value);

                var presenter = await _doctorServiceTierService.GetDisplayedTierForDoctor(userId);
                var list = presenter.ServiceTierList.Select(st => new
                {
                    st.Id,
                    st.Name,
                    st.MonthlyPrice,
                    st.Features
                });
                return Ok(new { list, presenter.CurrentTierId, presenter.Balance, presenter.ExpiredAt });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch active services tier");
                return StatusCode(500);
            }
        }

        [HttpPost("upgrade")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpgradeTier([FromBody] UpgradeServiceTierRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var userId = Guid.Parse(userIdClaim.Value);

                await _doctorServiceTierService.Upgrade(userId, request.ServiceTierId);
                return Ok();
            }
            catch (MedixException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upgrade services tier");
                return StatusCode(500);
            }
        }

        [HttpPut("unsubscribe")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UnsubscribeTier([FromBody] UpgradeServiceTierRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var userId = Guid.Parse(userIdClaim.Value);

                await _doctorServiceTierService.Unsubscribe(userId, request.ServiceTierId);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to unsubscribe services tier");
                return StatusCode(500);
            }
        }
    }

    public class UpgradeServiceTierRequest
    {
        public Guid ServiceTierId { get; set; }
    }
}
