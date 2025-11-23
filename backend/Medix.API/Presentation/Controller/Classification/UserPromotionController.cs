
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserPromotionController : ControllerBase
    {
        private readonly IUserPromotionService _userPromotionService;
        private readonly ILogger<UserPromotionController> _logger;

        public UserPromotionController(
            IUserPromotionService userPromotionService,
            ILogger<UserPromotionController> logger)
        {
            _userPromotionService = userPromotionService;
            _logger = logger;
        }

        /// <summary>
        /// Gán promotion cho user
        /// </summary>
        [HttpPost("assign")]
       
        public async Task<IActionResult> AssignPromotionToUser([FromBody] AssignPromotionRequest request)
        {
            try
            {
                if (request.UserId == Guid.Empty || request.PromotionId == Guid.Empty)
                {
                    return BadRequest(new { message = "UserId and PromotionId are required" });
                }

                var result = await _userPromotionService.AssignPromotionToUserAsync(
                    request.UserId,
                    request.PromotionId);

                return Ok(new
                {
                    message = "Promotion assigned successfully",
                    data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning promotion to user");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy promotion theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _userPromotionService.GetUserPromotionByIdAsync(id);

                if (result == null)
                    return NotFound(new { message = "User promotion not found" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user promotion by id: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Lấy tất cả promotions của một user
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetByUserId(Guid userId)
        {
            try
            {
                var result = await _userPromotionService.GetUserPromotionsByUserIdAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting promotions for user: {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Lấy các promotions còn hiệu lực của user
        /// </summary>
        [HttpGet("user/{userId}/active")]
        [Authorize]
        public async Task<IActionResult> GetActivePromotions(Guid userId)
        {
            try
            {
                var result = await _userPromotionService.GetActiveUserPromotionsAsync(userId);
                return Ok(new
                {
                    count = result.Count(),
                    promotions = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active promotions for user: {UserId}", userId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Lấy promotions của user hiện tại (từ token)
        /// </summary>
        [HttpGet("my-promotions")]
        [Authorize]
        public async Task<IActionResult> GetMyPromotions()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _userPromotionService.GetUserPromotionsByUserIdAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting my promotions");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Lấy active promotions của user hiện tại
        /// </summary>
        [HttpGet("my-active-promotions")]
        [Authorize]
        public async Task<IActionResult> GetMyActivePromotions()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _userPromotionService.GetActiveUserPromotionsAsync(userId);
                    return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting my active promotions");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Sử dụng promotion
        /// </summary>
        [HttpPost("{id}/use")]
        [Authorize]
        public async Task<IActionResult> UsePromotion(Guid id)
        {
            try
            {
                var result = await _userPromotionService.UsePromotionAsync(id);

                if (result == null)
                    return NotFound(new { message = "Promotion not found" });

                return Ok(new
                {
                    message = "Promotion used successfully",
                    data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error using promotion: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Deactivate promotion
        /// </summary>
        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> DeactivatePromotion(Guid id)
        {
            try
            {
                var success = await _userPromotionService.DeactivatePromotionAsync(id);

                if (!success)
                    return NotFound(new { message = "Promotion not found" });

                return Ok(new { message = "Promotion deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating promotion: {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Kiểm tra promotion có hợp lệ cho user không
        /// </summary>
        [HttpGet("validate")]
        [Authorize]
        public async Task<IActionResult> ValidatePromotion([FromQuery] Guid userId, [FromQuery] Guid promotionId)
        {
            try
            {
                if (userId == Guid.Empty || promotionId == Guid.Empty)
                {
                    return BadRequest(new { message = "UserId and PromotionId are required" });
                }

                var isValid = await _userPromotionService.IsPromotionValidForUserAsync(userId, promotionId);

                return Ok(new
                {
                    isValid,
                    message = isValid ? "Promotion is valid" : "Promotion is not valid or has expired"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating promotion");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("assign/bulk")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> AssignPromotionToMultipleUsers([FromBody] BulkAssignPromotionRequest request)
        {
            try
            {
                if (request.PromotionId == Guid.Empty)
                    return BadRequest(new { message = "PromotionId is required" });

                if (!request.ApplicableToAllUsers && !request.ApplicableToNewUsers && !request.ApplicableToVipUsers)
                    return BadRequest(new { message = "At least one target flag must be true" });

                var created = await _userPromotionService.AssignPromotionToMultipleUsersAsync(
                    request.PromotionId,
                    request.ApplicableToAllUsers,
                    request.ApplicableToNewUsers,
                    request.ApplicableToVipUsers,
                    request.NewUserDays ?? 30);

                return Ok(new
                {
                    message = "Bulk promotion assignment completed",
                    count = created.Count(),
                    data = created
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk assigning promotion");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }


    // DTO cho request assign promotion
    public class AssignPromotionRequest
    {
        public Guid UserId { get; set; }
        public Guid PromotionId { get; set; }
    }
}