using Google.GenAI.Types;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/ai-chat")]
    public class AIChatController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;
        private readonly IVertexAIService _vertexAIService;
        private readonly ILogger<AIChatController> _logger;

        public AIChatController(IAIChatService aiChatService, ILogger<AIChatController> logger, IVertexAIService vertexAIService)
        {
            _aiChatService = aiChatService;
            _logger = logger;
            _vertexAIService = vertexAIService;
        }

        [HttpPost("message")]
        [AllowAnonymous]
        public async Task<IActionResult> SendMessage([FromBody] PromptRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return BadRequest(new { message = "Message cannot be empty" });
                }

                await AddToConversationHistory(request.GuestToken, "user", request.Prompt);
                var response = await _vertexAIService.GetSymptompAnalysisAsync(GetConversationHistory(request.GuestToken));

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                await AddToConversationHistory(request.GuestToken, "assistant", response);
                var chatResponse = AIResponseParser.GetResponse(response);

                var diagnosisModel = AIResponseParser.ParseJson(response);
                if (diagnosisModel.IsConclusionReached)
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                    await _vertexAIService.SaveSymptompAnalysisAsync(diagnosisModel, userId?.Value);

                    var recommendedDoctors = await _vertexAIService.GetRecommendedDoctorsAsync(diagnosisModel.PossibleConditions!, 3);
                    return Ok(chatResponse + "\n\n" + recommendedDoctors);
                }
                return Ok(chatResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return StatusCode(500, new { message = "An error occurred while processing your message" });
            }
        }

        [HttpPost("analyze-emr")]
        public async Task<IActionResult> AnalyzeEMR([FromForm] EMRAnalysisRequest request)
        {
            try
            {
                ValidateFileRequest(request.File);

                await AddToConversationHistory(request.GuestToken, "user", "EMR của tôi:", request.File);
                var response = await _vertexAIService.GetSymptompAnalysisAsync(GetConversationHistory(request.GuestToken));

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                await AddToConversationHistory(request.GuestToken, "assistant", response);
                var chatResponse = AIResponseParser.GetResponse(response);

                var diagnosisModel = AIResponseParser.ParseJson(response);
                if (diagnosisModel.IsConclusionReached)
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                    await _vertexAIService.SaveSymptompAnalysisAsync(diagnosisModel, userId?.Value);

                    var recommendedDoctors = await _vertexAIService.GetRecommendedDoctorsAsync(diagnosisModel.PossibleConditions!, 3);
                    return Ok(chatResponse + "\n\n" + recommendedDoctors);
                }
                return Ok(chatResponse);
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

        private List<Content> GetConversationHistory(string guestKey)
        {
            if (string.IsNullOrEmpty(guestKey))
                throw new ArgumentException("Guest key is required");

            string sessionKey = $"ConversationHistory_{guestKey}";

            var historyJson = HttpContext.Session.GetString(sessionKey);
            var history = historyJson == null
                ? []
                : JsonConvert.DeserializeObject<List<ContentDto>?>(historyJson);
            if (history == null)
                return [];

            var conversationHistory = new List<Content>();
            foreach (var item in history)
            {
                _logger.LogInformation($"history: {item.Content}");
                var content = new Content
                {
                    Role = item.Role,
                    Parts = [
                        new Part
                        {
                            Text = item.Content
                        },
                        item.File != null ? new Part
                        {
                            InlineData = item.File
                        }
                        : null,
                    ]
                };
                conversationHistory.Add(content);
            }

            return conversationHistory;
        }

        private async Task<Blob> GetBlobFromFile(IFormFile file)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var bytes = ms.ToArray();
            var blob = new Blob
            {
                Data = bytes,
                MimeType = file.ContentType,
            };
            return blob;
        }

        private async Task AddToConversationHistory(string guestKey, string role, string content, IFormFile? file = null)
        {
            if (string.IsNullOrEmpty(guestKey))
                throw new ArgumentException("Guest key is required");

            string sessionKey = $"ConversationHistory_{guestKey}";

            var historyJson = HttpContext.Session.GetString(sessionKey);
            var history = historyJson == null
                ? []
                : JsonConvert.DeserializeObject<List<ContentDto>?>(historyJson);
            history ??= [];

            var contentDto = new ContentDto
            {
                Role = role,
                Content = content,
                File = file != null ? await GetBlobFromFile(file) : null
            };
            history.Add(contentDto);

            historyJson = JsonConvert.SerializeObject(history);
            HttpContext.Session.SetString(sessionKey, historyJson);
        }
    }

    public class EMRAnalysisRequest
    {
        public string GuestToken { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
    }

    public class PromptRequest
    {
        public string GuestToken { get; set; } = string.Empty;
        public string? Prompt { get; set; }
    }

    public class SystemQueryRequestDto
    {
        public string Query { get; set; } = string.Empty;
    }
}

