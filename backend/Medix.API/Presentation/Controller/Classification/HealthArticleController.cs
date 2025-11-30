﻿using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Services.Community;
using Microsoft.Extensions.Logging;
using Medix.API.Models.DTOs.HealthArticle;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json;
using Medix.API.Business.Services.Classification;
using System.Security.Claims;
using Medix.API.DataAccess.Interfaces.Classification;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthArticleController : ControllerBase
    {
        private readonly IHealthArticleService _healthArticleService;
        private readonly ILogger<HealthArticleController> _logger;
        private readonly CloudinaryService _cloudinaryService;
        private readonly IRefArticleStatusRepository _statusRepository;

        public HealthArticleController(IHealthArticleService healthArticleService, ILogger<HealthArticleController> logger, CloudinaryService cloudinaryService, IRefArticleStatusRepository statusRepository)
        {
            _healthArticleService = healthArticleService;
            _logger = logger;
            _cloudinaryService = cloudinaryService;
            _statusRepository = statusRepository;
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
            try
            {
                var result = await _healthArticleService.GetPublishedPagedAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting published health articles. Page: {Page}, PageSize: {PageSize}", page, pageSize);
                return StatusCode(500, new { message = "An unexpected error occurred while fetching published articles." });
            }
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
        [AllowAnonymous]
        public async Task<ActionResult> GetHomepage([FromQuery] int limit = 5)
        {
            var articles = await _healthArticleService.GetHomepageArticlesAsync(limit);
            return Ok(articles);
        }

        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var statuses = await _statusRepository.GetActiveStatusesAsync();
            var result = statuses
                .Where(s => s.Code.ToUpper() == "PUBLISHED" || s.Code.ToUpper() == "DRAFT")
                .Select(s => new { 
                    Code = s.Code, 
                    DisplayName = s.Code.ToUpper() == "PUBLISHED" ? "Xuất bản" : 
                                  s.Code.ToUpper() == "DRAFT" ? "Bản nháp" : s.DisplayName 
                })
                .OrderBy(s => s.Code.ToUpper() == "DRAFT" ? 0 : 1) 
                .ToList();
            return Ok(result);
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
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var authorId))
                {
                    return Unauthorized(new { Message = "Không thể xác thực người dùng hoặc ID người dùng không hợp lệ." });
                }

                model.AuthorId = authorId;

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
            catch (Medix.API.Exceptions.ValidationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating article");
                if (ex.InnerException != null)
                    _logger.LogError("Inner exception: {0}", ex.InnerException.Message);

                return StatusCode(500, new { message = "An unexpected error occurred while creating the article." });
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
            catch (Medix.API.Exceptions.ValidationException)
            {
                throw;
            }
            catch (Medix.API.Exceptions.NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating article with ID {ArticleId}", id);
                if (ex.InnerException != null)
                    _logger.LogError("Inner exception: {0}", ex.InnerException.Message);

                return StatusCode(500, new { message = "An unexpected error occurred while updating the article." });
            }

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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { Message = "Không thể xác thực người dùng để thực hiện hành động này." });
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { Message = "Không thể xác thực người dùng để thực hiện hành động này." });
            }

            var article = await _healthArticleService.UnlikeAsync(id, userId);
            if (article == null)
                return NotFound();

            return Ok(article);
        }
        [HttpGet("whoami")]
        public IActionResult WhoAmI()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }

        [HttpPost("{id}/view")]
        [AllowAnonymous] 
        public async Task<IActionResult> IncrementView(Guid id)
        {
            
            await _healthArticleService.IncrementViewCountOnlyAsync(id);

            return Ok();
        }
    }
}