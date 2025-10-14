using Medix.API.Application.Services;
using Medix.API.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Medix.API.DTOs;

namespace Medix.API.Controllers
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
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var (total, data) = await _healthArticleService.GetAllAsync(page, pageSize);
                return Ok(new { total, page, pageSize, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all health articles");
                return StatusCode(500, new { message = "An error occurred while retrieving articles" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var article = await _healthArticleService.GetByIdAsync(id);
                if (article == null)
                    return NotFound("Không tìm thấy bài viết.");

                return Ok(article);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health article by id: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the article" });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            try
            {
                var data = await _healthArticleService.SearchAsync(keyword);
                return Ok(new { total = data.Count(), data });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching health articles with keyword: {Keyword}", keyword);
                return StatusCode(500, new { message = "An error occurred while searching articles" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HealthArticleCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _healthArticleService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating health article");
                return StatusCode(500, new { message = "An error occurred while creating the article" });
            }
        }
        [HttpGet("{id}/edit")]
        public async Task<IActionResult> GetForEdit(Guid id)
        {
            try
            {
                var dto = await _healthArticleService.GetForEditAsync(id);
                return Ok(dto);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health article for edit: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the article for edit" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] HealthArticleUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _healthArticleService.UpdateAsync(id, dto);
                return Ok(new { message = "Cập nhật bài viết thành công.", article = result });
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
                _logger.LogError(ex, "Error updating health article: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the article" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _healthArticleService.DeleteAsync(id);
                return Ok("Đã xóa bài viết thành công.");
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting health article: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the article" });
            }
        }

    }
}
