using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Microsoft.Extensions.Logging;
using Medix.API.Models.DTOs.HealthArticle;
using Microsoft.AspNetCore.Authorization;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthArticleController : ControllerBase
    {
        private readonly IHealthArticleService _healthArticleService;
        private readonly ILogger<HealthArticleController> _logger;

        public HealthArticleController(IHealthArticleService healthArticleService, ILogger<HealthArticleController> logger)
        {
            _healthArticleService = healthArticleService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _healthArticleService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("published")]
        public async Task<ActionResult> GetPublished([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _healthArticleService.GetPublishedPagedAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting published health articles. Page: {Page}, PageSize: {PageSize}", page, pageSize);
                // Trả về lỗi 500 với thông điệp chung, chi tiết lỗi đã được ghi lại
                return StatusCode(500, new { message = "An unexpected error occurred while fetching published articles." });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> GetById(Guid id)
        {
            var article = await _healthArticleService.GetByIdAsync(id);
            if (article == null)
                return NotFound();
            return Ok(article);
        }

        [HttpGet("slug/{slug}")]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> GetBySlug(string slug)
        {
            var article = await _healthArticleService.GetBySlugAsync(slug);
            if (article == null)
                return NotFound();
            return Ok(article);
        }

        [HttpGet("homepage")]

        public async Task<ActionResult> GetHomepage([FromQuery] int limit = 5)
        {
            var articles = await _healthArticleService.GetHomepageArticlesAsync(limit);
            return Ok(articles);
        }

        [HttpGet("search")]
        public async Task<ActionResult> SearchByName([FromQuery] string? name)
        {
           
            var result = await _healthArticleService.SearchByNameAsync(name);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> Create([FromBody] HealthArticleCreateDto request)
        {
            var article = await _healthArticleService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = article.Id }, article);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> Update(Guid id, [FromBody] HealthArticleUpdateDto request)
        {
            var article = await _healthArticleService.UpdateAsync(id, request);
            return Ok(article);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]

        public async Task<ActionResult> Delete(Guid id)
        {
            await _healthArticleService.DeleteAsync(id);
            return Ok();
        }
        [HttpPost("{id}/like")]
        [Authorize] 
        public async Task<ActionResult> Like(Guid id)
        {
            // Try to get user id from claims
            Guid userId;
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out userId))
            {
                Console.WriteLine("WARN: Using hardcoded UserId for testing Like functionality.");
                userId = Guid.Parse("1A2C1A65-7B00-415F-8164-4FC3C1054203"); // <-- TODO: Thay thế bằng một UserId hợp lệ trong DB dev của bạn
                return Unauthorized();
            }

            var article = await _healthArticleService.LikeAsync(id, userId);
            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [HttpDelete("{id}/like")]
        [Authorize]

        public async Task<ActionResult> Unlike(Guid id)
        {
            Guid userId;
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out userId))
            {

              
                Console.WriteLine("WARN: Using hardcoded UserId for testing Unlike functionality.");
                userId = Guid.Parse("1A2C1A65-7B00-415F-8164-4FC3C1054203"); // <-- TODO: Thay thế bằng một UserId hợp lệ trong DB dev của bạn
                return Unauthorized();
            }

            var article = await _healthArticleService.UnlikeAsync(id, userId);
            if (article == null)
                return NotFound();

            return Ok(article);
        }
    }
}
