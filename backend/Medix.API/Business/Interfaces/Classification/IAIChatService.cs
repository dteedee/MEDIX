using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IAIChatService
    {
        Task<ChatResponseDto> SendMessageAsync(string prompt, List<ContentDto> conversationHistory, string? userIdClaim = null);
        Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<ContentDto> conversationHistory, string? userIdClaim = null);
    }
}

