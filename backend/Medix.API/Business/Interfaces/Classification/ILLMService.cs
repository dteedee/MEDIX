using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        Task<string> GetRequestTypeAsync(string prompt);
        Task<DiagnosisModel> GetSymptomAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> conversationHistory);
        Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> conversationHistory);
        Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions);
        Task<List<string>> GetRecommendedDoctorIdsByDiagnosisAsync(string diagnosis, int count, string doctorListString);
        Task<List<string>> GetRecommendedDoctorIdsByPromptAsync
            (string prompt, int count, string doctorListString, List<AIChatMessageDto> conversationHistory);
        Task<List<string>> GetRecommendedArticleIdListAsync(string userPrompt, string articleListString, int count);
        bool IsHealthRelatedQueryAsync(string query);
    }
}

