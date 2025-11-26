using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IAIChatService
    {
        Task<ChatResponseDto> SendMessageAsync(ChatRequestDto request);
        Task<SymptomAnalysisResponseDto> AnalyzeSymptomsAsync(SymptomAnalysisRequestDto request);
        Task<EMRAnalysisResponseDto> AnalyzeEMRAsync(IFormFile file, string? patientInfoJson);
        Task<SystemQueryResponseDto> QuerySystemAsync(string query);
    }
}

