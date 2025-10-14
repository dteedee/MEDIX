using Medix.API.Application.Services;
using Medix.API.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Medix.API.DTOs;

namespace Medix.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteBannerController : ControllerBase
    {
        private readonly ISiteBannerService _siteBannerService;
        private readonly ILogger<SiteBannerController> _logger;

        public SiteBannerController(ISiteBannerService siteBannerService, ILogger<SiteBannerController> logger)
        {
            _siteBannerService = siteBannerService;
            _logger = logger;
        }

        // GET: api/SiteBanner?page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var (total, data) = await _siteBannerService.GetAllAsync(page, pageSize);
                return Ok(new
                {
                    total,
                    page,
                    pageSize,
                    data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all site banners");
                return StatusCode(500, new { message = "An error occurred while retrieving banners" });
            }
        }

        // GET: api/SiteBanner/by-name?name=Health
        [HttpGet("by-name")]
        public async Task<IActionResult> GetByName([FromQuery] string name)
        {
            try
            {
                var banners = await _siteBannerService.GetByNameAsync(name);
                if (!banners.Any())
                    return NotFound($"Không tìm thấy banner nào có tên chứa '{name}'.");

                return Ok(banners);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting site banners by name: {Name}", name);
                return StatusCode(500, new { message = "An error occurred while retrieving banners by name" });
            }
        }

        // POST: api/SiteBanner
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SiteBannerCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _siteBannerService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByName), new { name = result.BannerTitle }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating site banner");
                return StatusCode(500, new { message = "An error occurred while creating the banner" });
            }
        }

        // PUT: api/SiteBanner/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] SiteBannerUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _siteBannerService.UpdateAsync(id, dto);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating site banner: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the banner" });
            }
        }

        // DELETE: api/SiteBanner/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _siteBannerService.DeleteAsync(id);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting site banner: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the banner" });
            }
        }
    }
}
