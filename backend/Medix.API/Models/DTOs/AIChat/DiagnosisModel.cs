using System.Text.Json.Serialization;

namespace Medix.API.Models.DTOs.AIChat
{
    public class DiagnosisModel
    {
        // Technical Fields (matching SQL/tracking data)
        public string? SessionId { get; set; }

        [JsonPropertyName("Symptoms")]
        public string?[]? SymptomsProvided { get; set; }

        [JsonPropertyName("SeverityLevelCode")]
        public string? SeverityCode { get; set; }

        public string? PossibleConditions { get; set; }
        public string? RecommendedAction { get; set; }
        public decimal ConfidenceScore { get; set; }

        // Boolean Status Flags (for server control flow)
        public bool IsConclusionReached { get; set; }
        public bool IsRequestRejected { get; set; }

        // User-Facing Field
        public string UserResponseText { get; set; } = null!;
    }
}
