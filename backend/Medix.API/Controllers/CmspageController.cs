using Medix.API.Application.Services;
using Medix.API.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Medix.API.DTOs;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CmspageController : ControllerBase
    {
        private readonly ICmspageService _cmspageService;
        private readonly ILogger<CmspageController> _logger;

        public CmspageController(ICmspageService cmspageService, ILogger<CmspageController> logger)
        {
            _cmspageService = cmspageService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var pages = await _cmspageService.GetAllAsync();
                return Ok(pages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all CMS pages");
                return StatusCode(500, new { message = "An error occurred while retrieving pages" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var page = await _cmspageService.GetByIdAsync(id);
                if (page == null)
                    return NotFound("Không tìm thấy trang.");

                return Ok(page);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting CMS page by id: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the page" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CmspageCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _cmspageService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating CMS page");
                return StatusCode(500, new { message = "An error occurred while creating the page" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CmspageUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _cmspageService.UpdateAsync(id, dto);
                return Ok(new { message = "Cập nhật thành công", page = result });
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
                _logger.LogError(ex, "Error updating CMS page: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the page" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _cmspageService.DeleteAsync(id);
                return Ok("Đã xóa trang thành công.");
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting CMS page: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the page" });
            }
        }
    }

}
