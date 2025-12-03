using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService(
        ILogger<AIChatService> logger,
        ILLMService llmService,
        IOCRService ocrService,
        IRAGService ragService) : IAIChatService
    {
        private readonly ILLMService _llmService = llmService;
        private readonly IOCRService _ocrService = ocrService;
        private readonly IRAGService _ragService = ragService;
        private readonly ILogger<AIChatService> _logger = logger;

        public async Task<ChatResponseDto> SendMessageAsync(string prompt, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            string? context = null;

            if (_llmService.IsHealthRelatedQueryAsync(prompt))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(prompt);
            }

            return await _llmService.GenerateResponseAsync(context, conversationHistory, userIdClaim);
        }

        public async Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            var ocrText = await _ocrService.ExtractTextAsync(file);
            if (ocrText == null)
            {
                throw new Exception("OCR extraction failed.");
            }

            string? context = null;
            if (_llmService.IsHealthRelatedQueryAsync(ocrText))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(ocrText);
            }

            return await _llmService.GetEMRAnalysisAsync(ocrText, context, conversationHistory, userIdClaim);
        }
    }
}

