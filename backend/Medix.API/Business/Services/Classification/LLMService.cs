using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService(
        ILogger<LLMService> logger,
        IConfiguration configuration,
        IGeminiAIService geminiAIService) : ILLMService
    {
        private readonly ILogger<LLMService> _logger = logger;
        private readonly IConfiguration _configuration = configuration;
        private readonly IGeminiAIService _geminiAiService = geminiAIService;

        public async Task<DiagnosisModel> GetSymptomAnalysisAsync(string? context, List<ContentDto> conversationHistory)
        {
            try
            {
                // Prefer Vertex if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetSymptompAnalysisAsync(context, conversationHistory);
                }

                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
                throw;
            }
        }

        public async Task<DiagnosisModel> GetEMRAnalysisAsync(
            string emrText,
            string? context,
            List<ContentDto> conversationHistory)
        {
            try
            {
                // Prefer Vertex if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetEMRAnalysisAsync(emrText, context, conversationHistory);
                }

                // Try to use OpenAI API if configured
                //var openAiApiKey = _configuration["OpenAI:ApiKey"];
                //if (!string.IsNullOrEmpty(openAiApiKey))
                //{
                //    return await _openAiService.GetEMRAnalysisAsync(emrText, context, conversationHistory);
                //}

                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
                throw;
            }
        }

        public async Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions)
        {
            try
            {
                // Prefer Vertex if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedMedicinesAsync(possibleConditions);
                }
                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended medicines");
                throw;
            }
        }

        public async Task SaveSymptompAnalysisAsync(DiagnosisModel diagnosisModel, string? userIdClaim)
        {
            try
            {
                // Prefer Vertex if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    await _geminiAiService.SaveSymptompAnalysisAsync(diagnosisModel, userIdClaim);
                    return;
                }
                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving symptom analysis");
                throw;
            }
        }

        public async Task<List<RecommendedDoctorDto>> GetRecommendedDoctorsAsync(string possibleConditions, int count)
        {
            try
            {
                // Prefer Vertex if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedDoctorsAsync(possibleConditions, count);
                }
                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended doctors");
                throw;
            }
        }

        public bool IsHealthRelatedQueryAsync(string query)
        {
            var lowerQuery = query.ToLower();

            var healthKeywords = new[]
            {
                "bệnh", "triệu chứng", "đau", "sốt", "ho", "mệt", "khám", "bác sĩ", "thuốc",
                "điều trị", "chẩn đoán", "sức khỏe", "y tế", "bệnh viện", "phòng khám",
                "khám bệnh", "điều trị", "thuốc men", "bệnh án", "hồ sơ bệnh án",
                "emr", "xét nghiệm", "chụp chiếu", "phẫu thuật", "phục hồi",
                "disease", "symptom", "pain", "fever", "cough", "doctor", "medicine", "treatment",
                "diagnosis", "health", "medical", "hospital", "clinic", "patient", "illness"
            };

            if (healthKeywords.Any(keyword => lowerQuery.Contains(keyword)))
                return true;

            var questionPatterns = new[]
            {
                @"(làm sao|như thế nào|tại sao|vì sao).*(bệnh|đau|sốt|ho|mệt)",
                @"(có nên|nên làm|phải làm).*(khám|điều trị|uống thuốc)",
                @"(bị|mắc|có).*(bệnh|triệu chứng|đau)"
            };

            foreach (var pattern in questionPatterns)
            {
                if (System.Text.RegularExpressions.Regex.IsMatch(lowerQuery, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                    return true;
            }

            return false;
        }
    }
}
