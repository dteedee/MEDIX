using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IGeminiAIService
    {
        Task<string> GetResponseAsync(string prompt, List<AIChatMessageDto> conversationHistory, ResponseSchema responseSchema, string? systemInstruction = null);
    }
}
