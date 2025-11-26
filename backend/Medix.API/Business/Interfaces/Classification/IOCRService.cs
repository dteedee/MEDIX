namespace Medix.API.Business.Interfaces.Classification
{
    public interface IOCRService
    {
        /// <summary>
        /// Extract text from EMR image/PDF
        /// </summary>
        Task<string> ExtractTextAsync(IFormFile file);

        /// <summary>
        /// Extract structured medical data from EMR
        /// </summary>
        Task<EMRExtractedData> ExtractMedicalDataAsync(IFormFile file);

        /// <summary>
        /// Validate if file is a valid EMR document
        /// </summary>
        Task<bool> ValidateEMRFileAsync(IFormFile file);
    }

    public class EMRExtractedData
    {
        public string? PatientName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? PatientId { get; set; }
        public List<string> Diagnoses { get; set; } = new();
        public List<MedicationInfo> Medications { get; set; } = new();
        public List<LabResult> LabResults { get; set; } = new();
        public List<string> Procedures { get; set; } = new();
        public Dictionary<string, string> VitalSigns { get; set; } = new();
        public string? Notes { get; set; }
        public string? ICD10Codes { get; set; }
        public DateTime? VisitDate { get; set; }
    }

    public class MedicationInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public string? Duration { get; set; }
    }

    public class LabResult
    {
        public string TestName { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public string? ReferenceRange { get; set; }
        public string? Status { get; set; } // "normal", "abnormal", "critical"
    }
}

