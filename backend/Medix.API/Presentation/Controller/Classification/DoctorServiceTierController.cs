using Medix.API.Business.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.Doctor;
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
                return Ok(new
                {
                    list,
                    presenter.CurrentTierId,
                    presenter.Balance,
                    presenter.ExpiredAt,
                    presenter.CurrentSubscriptionActive
                });
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
        [HttpGet("all")]
        public async Task<IActionResult> GetAllServiceTiers()
        {
            try
            {
                var tiers = await _doctorServiceTierService.GetAllServiceTiers();

                return Ok(tiers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch service tiers");
                return StatusCode(500);
            }
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateTier([FromBody] UpdateServiceTierRequest request)
        {
            try
            {
                await _doctorServiceTierService.UpdateServiceTier(request);
                return Ok(new { Message = "Service tier updated successfully" });
            }
            catch (MedixException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update service tier");
                return StatusCode(500);
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _doctorServiceTierService.GetServiceTierDetail(id);

                if (result == null)
                    return NotFound(new { Message = "Service tier not found" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get service tier detail");
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
