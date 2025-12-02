using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService : IAIChatService
    {
        private readonly ILLMService _llmService;
        private readonly IOCRService _ocrService;

        public AIChatService(
            ILLMService llmService,
            IOCRService ocrService)
        {
            _llmService = llmService;
            _ocrService = ocrService;
        }

        public async Task<ChatResponseDto> SendMessageAsync(List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            // Generate response using LLM with RAG context
            return await _llmService.GenerateResponseAsync(conversationHistory, userIdClaim);
        }

        public async Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<ContentDto> conversationHistory , string? userIdClaim = null)
        {
            return await _ocrService.GetEMRAnalysisAsync(file, conversationHistory, userIdClaim);
        }
    }
}

