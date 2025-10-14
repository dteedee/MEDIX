using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.ContentCategory;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContentCategoryController : ControllerBase
    {
        private readonly IContentCategoryService _contentCategoryService;

        public ContentCategoryController(IContentCategoryService contentCategoryService)
        {
            _contentCategoryService = contentCategoryService;
        }

        [HttpGet]
        public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _contentCategoryService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("search")]
        public async Task<ActionResult> Search([FromQuery] string keyword)
        {
            var categories = await _contentCategoryService.SearchAsync(keyword);
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var category = await _contentCategoryService.GetByIdAsync(id);
            if (category == null)
                return NotFound();
            return Ok(category);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] ContentCategoryCreateDto request)
        {
            var category = await _contentCategoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, [FromBody] ContentCategoryUpdateDto request)
        {
            var category = await _contentCategoryService.UpdateAsync(id, request);
            return Ok(category);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _contentCategoryService.DeleteAsync(id);
            return Ok();
        }
    }
}