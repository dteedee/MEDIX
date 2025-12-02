using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IVertexAIService
    {
        Task<ChatResponseDto> GetSymptompAnalysisAsync(List<ContentDto> conversationHistory, string? userIdClaim);
        Task<ChatResponseDto> GetEMRAnalysisAsync(IFormFile file, string? userIdClaim, List<ContentDto> history);
    }
}
