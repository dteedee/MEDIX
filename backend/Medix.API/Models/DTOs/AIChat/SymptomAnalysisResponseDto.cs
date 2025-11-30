namespace Medix.API.Models.DTOs.AIChat
{
    public class SymptomAnalysisResponseDto
    {
        public string Severity { get; set; } = string.Empty; // "mild", "moderate", "severe"
        public string Overview { get; set; } = string.Empty;
        public List<PossibleConditionDto> PossibleConditions { get; set; } = new();
        public HomeTreatmentDto? HomeTreatment { get; set; }
        public string? RecommendedSpecialty { get; set; }
        public List<RecommendedDoctorDto>? RecommendedDoctors { get; set; }
        public string Disclaimer { get; set; } = "Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế việc khám và điều trị của bác sĩ chuyên khoa.";
    }

    public class PossibleConditionDto
    {
        public string Condition { get; set; } = string.Empty;
        public double Probability { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class HomeTreatmentDto
    {
        public List<string> Instructions { get; set; } = new();
        public List<string>? Medications { get; set; }
        public List<string>? Precautions { get; set; }
    }

    public class RecommendedDoctorDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public double Rating { get; set; }
        public int Experience { get; set; }
        public decimal ConsultationFee { get; set; }
        public string? AvatarUrl { get; set; }
    }
}

