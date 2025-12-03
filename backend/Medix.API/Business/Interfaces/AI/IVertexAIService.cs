using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IVertexAIService
    {
        Task<DiagnosisModel> GetSymptompAnalysisAsync(string? context, List<ContentDto> history);
        Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<ContentDto> history);
        Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions);
        Task SaveSymptompAnalysisAsync(DiagnosisModel diagnosisModel, string? userIdClaim);
        Task<List<RecommendedDoctorDto>> GetRecommendedDoctorsAsync(string possibleConditions, int count);
    }
}
