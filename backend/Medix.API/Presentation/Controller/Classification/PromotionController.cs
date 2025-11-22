using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionController : ControllerBase
    {
        private readonly IPromotionService _promotionService;

        public PromotionController(IPromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        [HttpGet("code/{code}")]
        public async Task<IActionResult> GetPromotionByCodeAsync(string code)
        {
            var promotion = await _promotionService.GetPromotionByCodeAsync(code);
            if (promotion == null)
            {
                return NotFound();
            }
            if (promotion.EndDate < DateTime.UtcNow || !promotion.IsActive)
            {
                return BadRequest("Mã đã hết hạn sử dụng");
            }
            if (promotion.MaxUsage.HasValue && promotion.UsedCount >= promotion.MaxUsage.Value)
            {
                return BadRequest("Mã đã đạt giới hạn sử dụng");
            }
            return Ok(promotion);
        }

        [HttpGet("getAll")]
        [Authorize]
        public async Task<IActionResult> getAllPromotion()
        {
            try
            {
                var promotions = await _promotionService.GetAllPromotion();

                if (promotions == null || !promotions.Any())
                    return NoContent();

                return Ok(promotions);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while fetching promotions." });
            }
        }

        // Create promotion
        [HttpPost]
        [Authorize] // add role if needed: [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePromotion([FromBody] PromotionDto promotionDto)
        {
            if (promotionDto == null)
                return BadRequest("Promotion payload is required.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (string.IsNullOrWhiteSpace(promotionDto.Code))
                    return BadRequest("Promotion code is required.");

                // Prevent duplicate codes
                var exists = await _promotionService.PromotionCodeExistsAsync(promotionDto.Code);
                if (exists)
                    return Conflict(new { message = "Promotion code already exists." });

                var created = await _promotionService.CreatePromotionAsync(promotionDto);

                // Return 201 with location to GET by code
                return  Ok();
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while creating the promotion." });
            }
        }

        // Update promotion
        [HttpPut("{id:guid}")]
        [Authorize] // add role if needed: [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePromotion(Guid id, [FromBody] PromotionDto promotionDto)
        {
            if (promotionDto == null)
                return BadRequest("Promotion payload is required.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Ensure DTO carries the route id
                promotionDto.Id = id;

                // Verify promotion exists by id
                var all = await _promotionService.GetAllPromotion();
                var existing = all?.FirstOrDefault(p => p.Id == id);
                if (existing == null)
                    return NotFound();

                // If code changed, ensure new code isn't used by another promotion
                if (!string.Equals(existing.Code, promotionDto.Code, StringComparison.OrdinalIgnoreCase))
                {
                    var codeOwner = await _promotionService.GetPromotionByCodeAsync(promotionDto.Code ?? string.Empty);
                    if (codeOwner != null && codeOwner.Id != id)
                        return Conflict(new { message = "Another promotion already uses the specified code." });
                }

                var updated = await _promotionService.UpdatePromotionAsync(promotionDto);
                return Ok(updated);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while updating the promotion." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePromotion(Guid id)
        {
            try
            {
                var deleted = await _promotionService.DeletePromotionAsync(id);
                if (!deleted)
                    return NotFound();

                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while deleting the promotion." });
            }
        }
    }
}
