using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IGeminiAIService
    {
        Task<DiagnosisModel> GetSymptompAnalysisAsync(string? context, List<ContentDto> history);
        Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<ContentDto> history);
        Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions);
        Task<List<string>> GetRecommendedDoctorIdsAsync(string possibleConditions, int count, string doctorListString);
    }
}
