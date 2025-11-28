using Google.GenAI.Types;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Interfaces.AI
{
    public interface IVertexAIService
    {
        Task<string> GetSymptompAnalysisAsync(List<Content> conversationHistory);
        Task<string> GetRecommendedDoctorsAsync(string possibleConditions, int count);
        Task SaveSymptompAnalysisAsync(DiagnosisModel diagnosisModel, string? userId);
    }
}
