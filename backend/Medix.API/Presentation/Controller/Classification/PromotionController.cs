using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Services.Classification;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs.Manager;
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

        [HttpPost]
        [Authorize]
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

                var exists = await _promotionService.PromotionCodeExistsAsync(promotionDto.Code);
                if (exists)
                    return Conflict(new { message = "Promotion code already exists." });

                var created = await _promotionService.CreatePromotionAsync(promotionDto);

                var persisted = await _context.Promotions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Code == created.Code);

                int assignedCount = 0;

                if (persisted != null && !string.IsNullOrWhiteSpace(persisted.ApplicableTargets))
                {
                    var tokens = persisted.ApplicableTargets
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(t => t.Trim())
                        .ToList();

                    var applicableToAll = tokens.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));
                    var applicableToNew = tokens.Any(t => string.Equals(t, "NEW_USER", StringComparison.OrdinalIgnoreCase)
                                                          || string.Equals(t, "New", StringComparison.OrdinalIgnoreCase));

                    var newDaysToken = tokens.FirstOrDefault(t => t.StartsWith("NewDays:", StringComparison.OrdinalIgnoreCase));
                    int newUserDays = 30;
                    if (newDaysToken != null)
                    {
                        var parts = newDaysToken.Split(':', 2);
                        if (parts.Length == 2 && int.TryParse(parts[1], out var parsedDays))
                            newUserDays = Math.Max(1, parsedDays);
                    }

                    try
                    {
                        // ALL: assign via service (service implements bulk logic)
                        if (applicableToAll)
                        {
                            var assigned = await userPromotionService.AssignPromotionToMultipleUsersAsync(
                                persisted.Id,
                                true,  // all users
                                false, // new users flag not used here
                                false, // vip not applicable
                                newUserDays);

                            assignedCount += assigned?.Count() ?? 0;
                        }

                        // NEW_USER: prefer explicit StartDate/EndDate on promotion; if absent fallback to service new-user-days
                        if (applicableToNew)
                        {

                            var start = persisted.StartDate.Date;
                            var end = persisted.EndDate.Date.AddDays(1).AddTicks(-1);

                            var newUserIds = await _context.Users
                                .AsNoTracking()
                                .Where(u => u.CreatedAt >= start && u.CreatedAt <= end)
                                .Select(u => u.Id)
                                .ToListAsync();

                            foreach (var userId in newUserIds)
                            {
                                try
                                {
                                    await userPromotionService.AssignPromotionToUserAsync(userId, persisted.Id);
                                    assignedCount++;
                                }
                                catch
                                {
                                    // ignore individual failures
                                }
                            }
                        }
                        else
                        {
                            // fallback: use configured newUserDays heuristic
                            var assigned = await userPromotionService.AssignPromotionToMultipleUsersAsync(
                                persisted.Id,
                                false,
                                true,
                                false,
                                newUserDays);
                            assignedCount += assigned?.Count() ?? 0;
                        }
                        
                    }
                    catch
                    {
                        // swallow assignment errors so create succeeds; admin can re-run assignment separately
                    }
                }

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

        [HttpPut("{id:guid}")]
        [Authorize]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> UpdatePromotion(Guid id, [FromBody] PromotionDto promotionDto)
        {
            if (promotionDto == null)
                return BadRequest("Promotion payload is required.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                promotionDto.Id = id;

                var all = await _promotionService.GetAllPromotion();
                var existing = all?.FirstOrDefault(p => p.Id == id);
                if (existing == null)
                    return NotFound();

                if (!string.Equals(existing.Code, promotionDto.Code, StringComparison.OrdinalIgnoreCase))
                {
                    var codeOwner = await _promotionService.GetPromotionByCodeAsync(promotionDto.Code ?? string.Empty);
                    if (codeOwner != null && codeOwner.Id != id)
                        return Conflict(new { message = "Another promotion already uses the specified code." });
                }

                // Detect change to ApplicableTargets
                var existingTargets = (existing.ApplicableTargets ?? string.Empty).Trim();
                var newTargets = (promotionDto.ApplicableTargets ?? string.Empty).Trim();
                var applicableTargetsChanged = !string.Equals(existingTargets, newTargets, StringComparison.OrdinalIgnoreCase);

                // Persist update first
                var updated = await _promotionService.UpdatePromotionAsync(promotionDto);

                int assignedCount = 0;

                if (applicableTargetsChanged && !string.IsNullOrWhiteSpace(updated.ApplicableTargets))
                {
                    var tokens = updated.ApplicableTargets
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(t => t.Trim())
                        .ToList();

                    var applicableToAll = tokens.Any(t => string.Equals(t, "All", StringComparison.OrdinalIgnoreCase));
                    var applicableToNew = tokens.Any(t => string.Equals(t, "NEW_USER", StringComparison.OrdinalIgnoreCase)
                                                          || string.Equals(t, "New", StringComparison.OrdinalIgnoreCase));

                    var newDaysToken = tokens.FirstOrDefault(t => t.StartsWith("NewDays:", StringComparison.OrdinalIgnoreCase));
                    int newUserDays = 30;
                    if (newDaysToken != null)
                    {
                        var parts = newDaysToken.Split(':', 2);
                        if (parts.Length == 2 && int.TryParse(parts[1], out var parsedDays))
                            newUserDays = Math.Max(1, parsedDays);
                    }

                    try
                    {
                        if (applicableToAll)
                        {
                            var assigned = await userPromotionService.AssignPromotionToMultipleUsersAsync(
                                updated.Id,
                                true,
                                false,
                                false,
                                newUserDays);

                            assignedCount += assigned?.Count() ?? 0;
                        }

                        if (applicableToNew)
                        {

                            var start = updated.StartDate.Date;
                            var end = updated.EndDate.Date.AddDays(1).AddTicks(-1);

                            var newUserIds = await _context.Users
                                .AsNoTracking()
                                .Where(u => u.CreatedAt >= start && u.CreatedAt <= end)
                                .Select(u => u.Id)
                                .ToListAsync();

                            foreach (var userId in newUserIds)
                            {
                                try
                                {
                                    await userPromotionService.AssignPromotionToUserAsync(userId, updated.Id);
                                    assignedCount++;
                                }
                                catch
                                {
                                    // ignore individual failures
                                }

                            } }


                        else
                        {
                            var assigned = await userPromotionService.AssignPromotionToMultipleUsersAsync(
                                updated.Id,
                                false,
                                true,
                                false,
                                newUserDays);
                            assignedCount += assigned?.Count() ?? 0;
                        }
                        }
                    
                    catch
                    {
                        // swallow assignment errors
                    }
                }

                return Ok(new
                {
                    promotion = updated,
                    assignedCount,
                    message = assignedCount > 0 ? "Promotion updated and (re)assigned to users." : "Promotion updated."
                });
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
