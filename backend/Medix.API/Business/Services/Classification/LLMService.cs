using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService : ILLMService
    {
        private readonly ILogger<LLMService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IVertexAIService _vertexAiService;

        public LLMService(ILogger<LLMService> logger, IConfiguration configuration, IVertexAIService vertexAIService)
        {
            _logger = logger;
            _configuration = configuration;
            _vertexAiService = vertexAIService;
        }

        public async Task<ChatResponseDto> GenerateResponseAsync(string? context, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:Model"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetSymptompAnalysisAsync(context, conversationHistory, userIdClaim);
                }

                // Try to use OpenAI API if configured
                //var openAiApiKey = _configuration["OpenAI:ApiKey"];
                //if (!string.IsNullOrEmpty(openAiApiKey))
                //{
                //    return await CallOpenAIAsync(userMessage, context, conversationHistory);
                //}

                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
                throw;
            }
        }

        public async Task<ChatResponseDto> GetEMRAnalysisAsync(
            string emrText, 
            string? context, 
            List<ContentDto> conversationHistory, 
            string? userIdClaim = null)
        {
            try
            {
                // Prefer Vertex if configured
                var vertexApiKey = _configuration["GoogleCloud:Model"];
                if (!string.IsNullOrEmpty(vertexApiKey))
                {
                    return await _vertexAiService.GetEMRAnalysisAsync(emrText, context, userIdClaim, conversationHistory);
                }

                // Try to use OpenAI API if configured
                //var openAiApiKey = _configuration["OpenAI:ApiKey"];
                //if (!string.IsNullOrEmpty(openAiApiKey))
                //{
                //    return await CallOpenAIAsync(userMessage, context, conversationHistory);
                //}

                throw new InvalidOperationException("No LLM API configured.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
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
