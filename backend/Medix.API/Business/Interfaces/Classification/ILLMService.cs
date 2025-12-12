using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        Task<string> GetRequestTypeAsync(string prompt, List<AIChatMessageDto> messages);
        Task<string> GetSymptomAnalysisAsync(string prompt, List<AIChatMessageDto> messages, string? context = null);
        Task<string> GetRecommendedMedicineAsync(string diagnosis);
        Task<string> GetRecommendedDoctorIdListByDiagnosisAsync(string diagnosis, string doctorListString);
        Task<string> GetRecommendedDoctorIdListByPromptAsync(string prompt, List<AIChatMessageDto> messages, string doctorListString);
        Task<string> GetRecommendedArticleIdListAsync(string prompt, List<AIChatMessageDto> messages, string articleListString);
        Task<string> GetEMRAnalysisAsync(string emrText, List<AIChatMessageDto> messages, string? context = null);
        bool IsHealthRelatedQueryAsync(string query);
    }
}

