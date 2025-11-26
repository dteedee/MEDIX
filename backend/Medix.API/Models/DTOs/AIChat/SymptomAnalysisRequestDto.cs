namespace Medix.API.Models.DTOs.AIChat
{
    public class SymptomAnalysisRequestDto
    {
        public List<string> Symptoms { get; set; } = new();
        public string? AdditionalInfo { get; set; }
        public string? Duration { get; set; }
        public string? Severity { get; set; }
    }
}

