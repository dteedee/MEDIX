using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IAIChatService
    {
        Task<ChatResponseDto> SendMessageAsync(string prompt, List<AIChatMessageDto> conversationHistory, string? userIdClaim = null);
        Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<AIChatMessageDto> conversationHistory, string? userIdClaim = null);
    }
}

