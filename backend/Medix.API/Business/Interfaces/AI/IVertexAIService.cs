using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IVertexAIService
    {
        Task<ChatResponseDto> GetSymptompAnalysisAsync(string? context, List<ContentDto> history, string? userIdClaim);
        Task<ChatResponseDto> GetEMRAnalysisAsync(string emrText, string? context, string? userIdClaim, List<ContentDto> history);
    }
}
