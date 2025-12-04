namespace Medix.API.Models.DTOs.AIChat
{
    public class SymptomAnalysisResponseDto
    {
        public string Severity { get; set; } = string.Empty; // "mild", "moderate", "severe"
        public string RecommendedAction { get; set; } = string.Empty;
        public List<MedicineDto>? Medicines { get; set; }
        public string? RecommendedSpecialty { get; set; }
        public List<RecommendedDoctorDto>? RecommendedDoctors { get; set; }
        public string Disclaimer { get; set; } = "Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế việc khám và điều trị của bác sĩ chuyên khoa.";
    }

    public class MedicineDto
    {
        public string Name { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
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

