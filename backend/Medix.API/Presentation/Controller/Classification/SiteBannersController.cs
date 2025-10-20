using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.SiteBanner;
using Medix.API.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Medix.API.Business.Services.Community;
using CloudinaryDotNet;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]

    public class SiteBannersController : ControllerBase
    {
        private readonly ISiteBannerService _siteBannerService;
        private readonly CloudinaryService _cloudinaryService;

        public SiteBannersController(ISiteBannerService siteBannerService,CloudinaryService cloudinaryService)
        {
            _siteBannerService = siteBannerService;
            _cloudinaryService = cloudinaryService;
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
        public async Task<ActionResult> Create([FromForm] SiteBannerCreateDto request, IFormFile? bannerFile)
        {
            try
            {
                if (bannerFile != null && bannerFile.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadImageAsync(bannerFile);
                    request.BannerImageUrl = imageUrl;
                }

                var banner = await _siteBannerService.CreateAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = banner.Id }, banner);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, [FromForm] SiteBannerUpdateDto request, IFormFile? bannerFile)
        {
            try
            {
                if (bannerFile != null && bannerFile.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadImageAsync(bannerFile);
                    request.BannerImageUrl = imageUrl;
                }

                var banner = await _siteBannerService.UpdateAsync(id, request);
                return Ok(banner);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Errors);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                await _siteBannerService.DeleteAsync(id);
                return Ok();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult> SearchByName([FromQuery] string? name, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            

            var result = await _siteBannerService.SearchByNameAsync(name, page, pageSize);
            return Ok(result);
        }
    }
}