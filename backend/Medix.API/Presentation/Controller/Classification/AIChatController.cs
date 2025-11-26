using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/ai-chat")]
    public class AIChatController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;
        private readonly ILogger<AIChatController> _logger;

        public AIChatController(IAIChatService aiChatService, ILogger<AIChatController> logger)
        {
            _aiChatService = aiChatService;
            _logger = logger;
        }

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { message = "Message cannot be empty" });
                }

                var response = await _aiChatService.SendMessageAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return StatusCode(500, new { message = "An error occurred while processing your message" });
            }
        }

        [HttpPost("analyze-symptoms")]
        public async Task<IActionResult> AnalyzeSymptoms([FromBody] SymptomAnalysisRequestDto request)
        {
            try
            {
                if (request.Symptoms == null || !request.Symptoms.Any())
                {
                    return BadRequest(new { message = "Symptoms list cannot be empty" });
                }

                var response = await _aiChatService.AnalyzeSymptomsAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing symptoms");
                return StatusCode(500, new { message = "An error occurred while analyzing symptoms" });
            }
        }

        [HttpPost("analyze-emr")]
        public async Task<IActionResult> AnalyzeEMR([FromForm] IFormFile file, [FromForm] string? patientInfo)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "File is required" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "Invalid file type. Only JPG, PNG, and PDF are allowed" });
                }

                // Validate file size (max 10MB)
                if (file.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { message = "File size exceeds 10MB limit" });
                }

                var response = await _aiChatService.AnalyzeEMRAsync(file, patientInfo);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing EMR");
                return StatusCode(500, new { message = "An error occurred while analyzing EMR" });
            }
        }

        [HttpPost("query-system")]
        public async Task<IActionResult> QuerySystem([FromBody] SystemQueryRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new { message = "Query cannot be empty" });
                }

                var response = await _aiChatService.QuerySystemAsync(request.Query);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying system");
                return StatusCode(500, new { message = "An error occurred while querying system" });
            }
        }
    }

    public class SystemQueryRequestDto
    {
        public string Query { get; set; } = string.Empty;
    }
}

