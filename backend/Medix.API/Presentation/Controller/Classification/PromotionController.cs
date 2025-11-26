using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
   
    public class PromotionController : ControllerBase
    {
        private readonly IPromotionService _promotionService;
        private readonly MedixContext _context;
        private readonly IUserPromotionService userPromotionService;


        public PromotionController(IPromotionService promotionService, MedixContext context, IUserPromotionService userPromotionService)
        {
            _promotionService = promotionService;
            _context = context;
            this.userPromotionService = userPromotionService;
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
        [Authorize(Roles = "Manager")]
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

                // Try to read persisted Promotion entity to determine applicable targets.
                // Use code (unique) to find the persisted row.
                var persisted = await _context.Promotions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Code == created.Code);

                int assignedCount = 0;

                if (persisted != null && !string.IsNullOrWhiteSpace(persisted.ApplicableTargets))
                {
                    // Expected format: comma separated tokens like "All", "New", "VIP"
                    var tokens = persisted.ApplicableTargets
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(t => t.Trim())
                        .ToList();

                    var applicableToAll = tokens.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));
                    var applicableToNew = tokens.Any(t => string.Equals(t, "New", StringComparison.OrdinalIgnoreCase)
                                                          || string.Equals(t, "NewUsers", StringComparison.OrdinalIgnoreCase));
                    var applicableToVip = tokens.Any(t => string.Equals(t, "VIP", StringComparison.OrdinalIgnoreCase)
                                                          || string.Equals(t, "Vip", StringComparison.OrdinalIgnoreCase));

                    // Optional: if token contains "NewDays:XX" parse it
                    var newDaysToken = tokens.FirstOrDefault(t => t.StartsWith("NewDays:", StringComparison.OrdinalIgnoreCase));
                    int newUserDays = 30;
                    if (newDaysToken != null)
                    {
                        var parts = newDaysToken.Split(':', 2);
                        if (parts.Length == 2 && int.TryParse(parts[1], out var parsedDays))
                            newUserDays = Math.Max(1, parsedDays);
                    }

                    // Call bulk assignment -- do not fail creation if assignment fails; catch exceptions separately.
                    try
                    {
                        var assigned = await userPromotionService.AssignPromotionToMultipleUsersAsync(
                            persisted.Id,
                            applicableToAll,
                            applicableToNew,
                            applicableToVip,
                            newUserDays);

                        assignedCount = assigned?.Count() ?? 0;
                    }
                    catch (Exception ex)
                    { 
                   
                    }
                }

                // Return created promotion and assignment summary
                return Ok(new
                {
                    promotion = created,
                    assignedCount,
                    message = assignedCount > 0 ? "Promotion created and assigned to users." : "Promotion created."
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while creating the promotion." });
            }
        }

        // Update promotion
        [HttpPut("{id:guid}")]
        [Authorize] // add role if needed: [Authorize(Roles = "Admin")]
        [Authorize(Roles = "Manager")]
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

        [HttpGet("getTarget")]
        [Authorize(Roles = "Manager")]

        public async Task<IActionResult> GetPromotionTargets()
        {
            try
            {
                var targets = await _context.RefPromotionTargets.Select(x => new
                {
                    x.Name,
                    x.Id,
                    x.Target,
                    x.Description
                }).ToListAsync();
                if (targets == null || !targets.Any())
                    return NoContent();
                return Ok(targets);
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while fetching promotion targets." });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
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
