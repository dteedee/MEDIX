using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        Task<ChatResponseDto> GenerateResponseAsync(List<ContentDto> conversationHistory, string? userIdClaim);
    }
}

