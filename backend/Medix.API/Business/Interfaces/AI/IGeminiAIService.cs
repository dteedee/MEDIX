using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IGeminiAIService
    {
        Task<string> GetRequestTypeAsync(string prompt);
        Task<DiagnosisModel> GetSymptompAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> history);
        Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> history);
        Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions);
        Task<List<string>> GetRecommendedDoctorIdsByConditionsAsync(string possibleConditions, int count, string doctorListString);
        Task<List<string>> GetRecommendedDoctorIdsByPromptAsync
            (string userPrompt, int count, string doctorListString, List<AIChatMessageDto> conversationHistory);
        Task<List<string>> GetRecommendedArticleIdListAsync(string userPrompt, string articleListString, int count);
    }
}
