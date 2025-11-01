namespace Medix.API.Models.DTOs.MedicalRecordDTO
{
    public class PrescriptionDto
    {
        public Guid Id { get; set; }
        public string MedicationName { get; set; } = null!;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Instructions { get; set; }
    }

    public class CreatePrescriptionDto
    {
        public string MedicationName { get; set; } = null!;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Instructions { get; set; }
    }
}
