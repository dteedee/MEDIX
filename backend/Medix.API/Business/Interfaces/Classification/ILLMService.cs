using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        Task<ChatResponseDto> GenerateResponseAsync(string? context, List<ContentDto> conversationHistory, string? userIdClaim = null);
        Task<ChatResponseDto> GetEMRAnalysisAsync(string emrText, string? context, List<ContentDto> conversationHistory, string? userIdClaim = null);
        bool IsHealthRelatedQueryAsync(string query);
    }
}

