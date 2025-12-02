using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService : ILLMService
    {
        private readonly ILogger<LLMService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IVertexAIService _vertexAiService;

        public LLMService(ILogger<LLMService> logger, IConfiguration configuration, IVertexAIService vertexAIService)
        {
            _logger = logger;
            _configuration = configuration;
            _vertexAiService = vertexAIService;
        }

        public async Task<ChatResponseDto> GenerateResponseAsync(List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["Vertex:Model"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetSymptompAnalysisAsync(conversationHistory, userIdClaim);
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
