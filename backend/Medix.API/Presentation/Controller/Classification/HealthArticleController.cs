using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.HealthArticle;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthArticleController : ControllerBase
    {
        private readonly IHealthArticleService _healthArticleService;

        public HealthArticleController(IHealthArticleService healthArticleService)
        {
            _healthArticleService = healthArticleService;
        }

        [HttpGet]
        public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _healthArticleService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("published")]
        public async Task<ActionResult> GetPublished([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _healthArticleService.GetPublishedPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var article = await _healthArticleService.GetByIdAsync(id);
            if (article == null)
                return NotFound();
            return Ok(article);
        }

        [HttpGet("slug/{slug}")]
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
        public async Task<ActionResult> SearchByName([FromQuery] string name, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { Message = "Name query is required" });

            var result = await _healthArticleService.SearchByNameAsync(name, page, pageSize);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] HealthArticleCreateDto request)
        {
            var article = await _healthArticleService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = article.Id }, article);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, [FromBody] HealthArticleUpdateDto request)
        {
            var article = await _healthArticleService.UpdateAsync(id, request);
            return Ok(article);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _healthArticleService.DeleteAsync(id);
            return Ok();
        }
    }
}