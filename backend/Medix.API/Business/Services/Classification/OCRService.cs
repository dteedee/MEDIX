using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class OCRService : IOCRService
    {
        private readonly ILogger<OCRService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IVertexAIService _vertexAiService;

        public OCRService(ILogger<OCRService> logger, IConfiguration configuration, IVertexAIService vertexAIService)
        {
            _logger = logger;
            _configuration = configuration;
            _vertexAiService = vertexAIService;
        }

        public async Task<ChatResponseDto> GetEMRAnalysisAsync(IFormFile file, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["Vertex:Model"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetEMRAnalysisAsync(file, userIdClaim, conversationHistory);
                }

                // Try to use OpenAI API if configured
                //var openAiApiKey = _configuration["OpenAI:ApiKey"];
                //if (!string.IsNullOrEmpty(openAiApiKey))
                //{
                //    return await CallOpenAIAsync(userMessage, context, conversationHistory);
                //}

                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
                throw;
            }
        }
    }
}

