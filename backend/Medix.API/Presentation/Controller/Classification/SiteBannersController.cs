using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.SiteBanner;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteBannersController : ControllerBase
    {
        private readonly ISiteBannerService _siteBannerService;

        public SiteBannersController(ISiteBannerService siteBannerService)
        {
            _siteBannerService = siteBannerService;
        }

        [HttpGet]
        public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _siteBannerService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("active")]
        public async Task<ActionResult> GetActive([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _siteBannerService.GetActivePagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var banner = await _siteBannerService.GetByIdAsync(id);
            if (banner == null)
                return NotFound();
            return Ok(banner);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] SiteBannerCreateDto request)
        {
            var banner = await _siteBannerService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = banner.Id }, banner);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, [FromBody] SiteBannerUpdateDto request)
        {
            var banner = await _siteBannerService.UpdateAsync(id, request);
            return Ok(banner);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _siteBannerService.DeleteAsync(id);
            return Ok();
        }

        [HttpGet("search")]
        public async Task<ActionResult> SearchByName([FromQuery] string? name, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            

            var result = await _siteBannerService.SearchByNameAsync(name, page, pageSize);
            return Ok(result);
        }
    }
}