using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.Constants;
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
                var response = await _aiChatService.SendMessageAsync(request.Prompt, GetSavedConversation(request.ChatToken), userIdClaim?.Value);

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                AddToConversationHistory(request.ChatToken, "user", request.Prompt);
                AddToConversationHistory(request.ChatToken, "assistant", response.Text, response);
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
                var response = await _aiChatService.AnalyzeEMRAsync(request.File!, GetSavedConversation(request.ChatToken), userIdClaim?.Value);

                if (response == null)
                {
                    throw new Exception("AI service returned null response");
                }

                AddToConversationHistory(request.ChatToken, "assistant", response.Text, response);
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

        [HttpGet("conversation-history/{chatToken}")]
        public IActionResult GetChatConversationHistory([FromRoute] string chatToken)
        {
            try
            {
                var history = GetSavedConversation(chatToken);
                var chatHistory = new List<ChatResponseDto>();

                foreach (var item in history)
                {
                    if (item.Role == "user")
                    {
                        chatHistory.Add(new ChatResponseDto
                        {
                            Text = item.Content,
                            Sender = "user",
                        });
                    }
                    else
                    {
                        chatHistory.Add(item.AIResponse!);
                    }
                }
                return Ok(chatHistory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving conversation history");
                return StatusCode(500, new { message = "An error occurred while retrieving conversation history" });
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

        private List<ContentDto> GetSavedConversation(string chatToken)
        {
            if (string.IsNullOrEmpty(chatToken))
                throw new ArgumentException("Chat key is required");

            string sessionKey = $"ConversationHistory_{chatToken}";

            var historyJson = HttpContext.Session.GetString(sessionKey);
            var history = historyJson == null
                ? []
                : JsonConvert.DeserializeObject<List<ContentDto>?>(historyJson);

            if (history == null)
                return [];

            return history;
        }

        private void AddToConversationHistory(string chatToken, string role, string content,
            ChatResponseDto? aiResponse = null)
        {

            var history = GetSavedConversation(chatToken);
            string sessionKey = $"ConversationHistory_{chatToken}";

            var contentDto = new ContentDto
            {
                Role = role,
                Content = content,
                AIResponse = aiResponse,
            };
            history.Add(contentDto);

            var historyJson = JsonConvert.SerializeObject(history);
            HttpContext.Session.SetString(sessionKey, historyJson);
        }
    }

    public class EMRAnalysisRequest
    {
        public string ChatToken { get; set; } = null!;
        public IFormFile? File { get; set; }
    }

    public class PromptRequest
    {
        public string ChatToken { get; set; } = null!;
        public string? Prompt { get; set; }
    }

    public class SystemQueryRequestDto
    {
        public string Query { get; set; } = string.Empty;
    }
}

