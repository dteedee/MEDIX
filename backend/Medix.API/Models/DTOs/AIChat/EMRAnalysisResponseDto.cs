namespace Medix.API.Models.DTOs.AIChat
{
    public class EMRAnalysisResponseDto
    {
        public ExtractedEMRDataDto ExtractedData { get; set; } = new();
        public string Summary { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = new();
    }

    public class ExtractedEMRDataDto
    {
        public string? PatientName { get; set; }
        public string? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public List<string>? Diagnosis { get; set; }
        public List<string>? Medications { get; set; }
        public object? TestResults { get; set; }
        public string? Notes { get; set; }
    }
}

