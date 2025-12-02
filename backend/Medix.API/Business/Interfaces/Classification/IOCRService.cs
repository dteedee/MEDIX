using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IOCRService
    {
        Task<ChatResponseDto> GetEMRAnalysisAsync(IFormFile file, List<ContentDto> conversationHistory, string? userIdClaim = null);
    }
}

