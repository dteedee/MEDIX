using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService(
        ILogger<LLMService> logger,
        IConfiguration configuration,
        IGeminiAIService geminiAIService,
        IVertexAIService vertexAIService) : ILLMService
    {
        private readonly ILogger<LLMService> _logger = logger;
        private readonly IConfiguration _configuration = configuration;
        private readonly IGeminiAIService _geminiAiService = geminiAIService;
        private readonly IVertexAIService _vertexAiService = vertexAIService;

        public async Task<string> GetRequestTypeAsync(string prompt)
        {
            // Prefer Vertex if configured
            try
            {
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetRequestTypeAsync(prompt);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRequestTypeAsync(prompt);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response with Gemini");
            }

            _logger.LogError("Error generating LLM response");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<DiagnosisModel> GetSymptomAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> conversationHistory)
        {
            // Prefer Vertex if configured
            try
            {
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetSymptompAnalysisAsync(prompt, context, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetSymptompAnalysisAsync(prompt, context, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response with Gemini");
            }

            _logger.LogError("Error generating LLM response");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> conversationHistory)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetEMRAnalysisAsync(emrText, context, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating EMR analysis with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetEMRAnalysisAsync(emrText, context, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating EMR analysis with Gemini");
            }

            _logger.LogError("Error generating EMR analysis");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetRecommendedMedicinesAsync(possibleConditions);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended medicines with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedMedicinesAsync(possibleConditions);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended medicines with Gemini");
            }

            _logger.LogError("Error getting recommended medicines");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByDiagnosisAsync(string diagnosis, int count, string doctorListString)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetRecommendedDoctorIdsByDiagnosisAsync(diagnosis, count, doctorListString);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended doctors with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedDoctorIdsByDiagnosisAsync(diagnosis, count, doctorListString);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended doctors with Gemini");
            }

            _logger.LogError("Error getting recommended doctors");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByPromptAsync
            (string prompt, int count, string doctorListString, List<AIChatMessageDto> conversationHistory)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetRecommendedDoctorIdsByPromptAsync(prompt, count, doctorListString, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended doctors with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedDoctorIdsByPromptAsync(prompt, count, doctorListString, conversationHistory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended doctors with Gemini");
            }

            _logger.LogError("Error getting recommended doctors");
            throw new InvalidOperationException("No LLM API configured.");
        }

        public async Task<List<string>> GetRecommendedArticleIdListAsync(string userPrompt, string articleListString, int count)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:ProjectId"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetRecommendedArticleIdListAsync(userPrompt, articleListString, count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended articles with Vertex, falling back to Gemini");
            }

            try
            {
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await _geminiAiService.GetRecommendedArticleIdListAsync(userPrompt, articleListString, count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommended articles with Gemini");
            }

            _logger.LogError("Error getting recommended articles");
            throw new InvalidOperationException("No LLM API configured.");
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
