namespace Medix.API.Business.Interfaces.Classification
{
    public interface ILLMService
    {
        /// <summary>
        /// Generate response using LLM with context
        /// </summary>
        Task<string> GenerateResponseAsync(string userMessage, string? context = null, List<ChatMessage>? conversationHistory = null);

        /// <summary>
        /// Analyze symptoms with medical reasoning
        /// </summary>
        Task<SymptomAnalysisResult> AnalyzeSymptomsWithLLMAsync(List<string> symptoms, string? additionalInfo, string? context);

        /// <summary>
        /// Classify severity level using medical guidelines
        /// </summary>
        Task<SeverityClassification> ClassifySeverityAsync(List<string> symptoms, Dictionary<string, object> patientInfo);

        /// <summary>
        /// Check if query is health-related (safety guardrail)
        /// </summary>
        Task<bool> IsHealthRelatedQueryAsync(string query);

        /// <summary>
        /// Extract structured information from unstructured text
        /// </summary>
        Task<T> ExtractStructuredDataAsync<T>(string text, string schema) where T : class;
    }

    public class SymptomAnalysisResult
    {
        public string Severity { get; set; } = string.Empty; // "mild", "moderate", "severe"
        public string Overview { get; set; } = string.Empty;
        public List<ConditionProbability> PossibleConditions { get; set; } = new();
        public string Reasoning { get; set; } = string.Empty;
        public List<string> MissingInformation { get; set; } = new();
        public double ConfidenceScore { get; set; }
    }

    public class ConditionProbability
    {
        public string Condition { get; set; } = string.Empty;
        public double Probability { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ICD10Code { get; set; } = string.Empty;
        public string RecommendedSpecialty { get; set; } = string.Empty;
    }

    public class SeverityClassification
    {
        public string Level { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public List<string> RiskFactors { get; set; } = new();
        public bool RequiresImmediateAttention { get; set; }
        public string UrgencyLevel { get; set; } = string.Empty; // "low", "medium", "high", "critical"
    }

    public class ChatMessage
    {
        public string Role { get; set; } = string.Empty; // "user" or "assistant"
        public string Content { get; set; } = string.Empty;
    }
}

