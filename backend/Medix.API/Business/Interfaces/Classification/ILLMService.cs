using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        Task<DiagnosisModel> GetSymptomAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> conversationHistory);
        Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> conversationHistory);
        Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions);
        Task<List<string>> GetRecommendedDoctorIdsAsync(string possibleConditions, int count, string doctorListString);
        bool IsHealthRelatedQueryAsync(string query);
    }
}

