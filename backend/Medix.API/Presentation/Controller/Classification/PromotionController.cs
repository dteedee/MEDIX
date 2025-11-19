using Medix.API.Business.Interfaces.Classification;
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
        

    }
}
