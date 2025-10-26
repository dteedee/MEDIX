﻿using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Services.Community;
using Microsoft.Extensions.Logging;
using Medix.API.Models.DTOs.HealthArticle;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json;
using Medix.API.Business.Services.Classification;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthArticleController : ControllerBase
    {
        private readonly IHealthArticleService _healthArticleService;
        private readonly ILogger<HealthArticleController> _logger;
        private readonly CloudinaryService _cloudinaryService;

        public HealthArticleController(IHealthArticleService healthArticleService, ILogger<HealthArticleController> logger, CloudinaryService cloudinaryService)
        {
            _healthArticleService = healthArticleService;
            _logger = logger;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet]
        //[Authorize(Roles = "Manager")]

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
        //[Authorize(Roles = "Manager")]

        public async Task<ActionResult> GetById(Guid id)
        {
            var article = await _healthArticleService.GetByIdAsync(id);
            if (article == null)
                return NotFound();
            return Ok(article);
        }

        [HttpGet("slug/{slug}")]
        //[Authorize(Roles = "Manager")]

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
        public async Task<IActionResult> Create([FromForm] HealthArticleCreateDto model, IFormFile? thumbnailFile, IFormFile? coverFile)
        {
            try
            {
                if (thumbnailFile != null)
                {
                    var thumbUrl = await _cloudinaryService.UploadImageAsync(thumbnailFile);
                    if (!string.IsNullOrEmpty(thumbUrl))
                        model.ThumbnailUrl = thumbUrl;
                }

                if (coverFile != null)
                {
                    var coverUrl = await _cloudinaryService.UploadImageAsync(coverFile);
                    if (!string.IsNullOrEmpty(coverUrl))
                        model.CoverImageUrl = coverUrl;
                }

                var article = await _healthArticleService.CreateAsync(model);
                return CreatedAtAction(nameof(GetById), new { id = article.Id }, article);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating article");
                if (ex.InnerException != null)
                    _logger.LogError("Inner exception: {0}", ex.InnerException.Message);

                return StatusCode(500, new
                {
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }

        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] HealthArticleUpdateDto model, IFormFile? thumbnailFile, IFormFile? coverFile)
        {
            try
            {
                if (thumbnailFile != null)
                {
                    var thumbUrl = await _cloudinaryService.UploadImageAsync(thumbnailFile);
                    if (!string.IsNullOrEmpty(thumbUrl))
                        model.ThumbnailUrl = thumbUrl;
                }

                if (coverFile != null)
                {
                    var coverUrl = await _cloudinaryService.UploadImageAsync(coverFile);
                    if (!string.IsNullOrEmpty(coverUrl))
                        model.CoverImageUrl = coverUrl;
                }

                var updated = await _healthArticleService.UpdateAsync(id, model);
                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating article");
                if (ex.InnerException != null)
                    _logger.LogError("Inner exception: {0}", ex.InnerException.Message);

                return StatusCode(500, new
                {
                    message = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }

        }


        [HttpDelete("{id}")]
        //[Authorize(Roles = "Manager")]

        public async Task<ActionResult> Delete(Guid id)
        {
            await _healthArticleService.DeleteAsync(id);
            return Ok();
        }
        [HttpPost("{id}/like")]
        //[Authorize] 
        public async Task<ActionResult> Like(Guid id)
        {
            // Try to get user id from claims
            Guid userId;
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out userId))
            {
                Console.WriteLine("WARN: Using hardcoded UserId for testing Like functionality.");
                userId = Guid.Parse("EC122B8D-5252-45BE-BCEF-78D478FF3474");
                //return Unauthorized();
            }

            var article = await _healthArticleService.LikeAsync(id, userId);
            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [HttpDelete("{id}/like")]
        //[Authorize]

        public async Task<ActionResult> Unlike(Guid id)
        {
            Guid userId;
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out userId))
            {


                Console.WriteLine("WARN: Using hardcoded UserId for testing Unlike functionality.");
                userId = Guid.Parse("EC122B8D-5252-45BE-BCEF-78D478FF3474");
                //return Unauthorized();
            }

            var article = await _healthArticleService.UnlikeAsync(id, userId);
            if (article == null)
                return NotFound();

            return Ok(article);
        }
    }
}