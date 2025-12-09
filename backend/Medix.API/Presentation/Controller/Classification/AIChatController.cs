using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/ai-chat")]
    public class AIChatController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;
        private readonly ILogger<AIChatController> _logger;

        public AIChatController(
            ILogger<AIChatController> logger,
            IAIChatService aIChatService)
        {
            _logger = logger;
            _aiChatService = aIChatService;
        }

        [HttpPost("message")]
        [AllowAnonymous]
        public async Task<IActionResult> SendMessage([FromBody] PromptRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return BadRequest(new { message = "Vui lòng nhập câu hỏi" });
                }
                
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                var response = await _aiChatService.SendMessageAsync(request.Prompt, request.Messages, userIdClaim?.Value);

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return StatusCode(500, new { message = "An error occurred while processing your message" });
            }
        }

        [HttpPost("analyze-emr")]
        [AllowAnonymous]
        public async Task<IActionResult> AnalyzeEMR([FromForm] EMRAnalysisRequest request)
        {
            try
            {
                ValidateFileRequest(request.File);

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                var response = await _aiChatService.AnalyzeEMRAsync(request.File!, request.Messages, userIdClaim?.Value);

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                return Ok(response);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogWarning(argEx, "Invalid file upload attempt");
                return BadRequest(new { message = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing EMR");
                return StatusCode(500, new { message = "An error occurred while analyzing EMR" });
            }
        }

        private void ValidateFileRequest(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is required");
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new ArgumentException("Invalid file type. Only JPG, PNG, and PDF are allowed");
            }

            // Validate file size (max 10MB)
            if (file.Length > 10 * 1024 * 1024)
            {
                throw new ArgumentException("File size exceeds 10MB limit");
            }
        }
    }

    public class EMRAnalysisRequest
    {
        public IFormFile? File { get; set; }
        public List<AIChatMessageDto> Messages { get; set; } = new List<AIChatMessageDto>();
    }

    public class PromptRequest
    {
        public string? Prompt { get; set; }
        public List<AIChatMessageDto> Messages { get; set; } = new List<AIChatMessageDto>();
    }
}

