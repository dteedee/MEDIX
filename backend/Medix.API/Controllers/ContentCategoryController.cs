using Medix.API.Application.Services;
using Medix.API.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Medix.API.DTOs;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContentCategoryController : ControllerBase
    {
        private readonly IContentCategoryService _contentCategoryService;
        private readonly ILogger<ContentCategoryController> _logger;

        public ContentCategoryController(IContentCategoryService contentCategoryService, ILogger<ContentCategoryController> logger)
        {
            _contentCategoryService = contentCategoryService;
            _logger = logger;
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var (total, data) = await _contentCategoryService.GetPagedAsync(page, pageSize);
                return Ok(new { total, page, pageSize, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paged content categories");
                return StatusCode(500, new { message = "An error occurred while retrieving categories" });
            }
        }

        // GET: api/ContentCategory/search?keyword=health
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            try
            {
                var data = await _contentCategoryService.SearchAsync(keyword);
                return Ok(new { total = data.Count(), data });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching content categories with keyword: {Keyword}", keyword);
                return StatusCode(500, new { message = "An error occurred while searching categories" });
            }
        }

        // GET: api/ContentCategory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var category = await _contentCategoryService.GetByIdAsync(id);
                if (category == null)
                    return NotFound("Không tìm thấy danh mục.");

                return Ok(category);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting content category by id: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the category" });
            }
        }

        // POST: api/ContentCategory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ContentCategoryCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _contentCategoryService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating content category");
                return StatusCode(500, new { message = "An error occurred while creating the category" });
            }
        }

        // PUT: api/ContentCategory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ContentCategoryUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _contentCategoryService.UpdateAsync(id, dto);
                return Ok(new
                {
                    message = "Cập nhật danh mục thành công.",
                    category = result
                });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating content category: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the category" });
            }
        }

        // DELETE: api/ContentCategory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _contentCategoryService.DeleteAsync(id);
                return Ok("Đã xóa danh mục thành công.");
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting content category: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the category" });
            }
        }
    }

}
