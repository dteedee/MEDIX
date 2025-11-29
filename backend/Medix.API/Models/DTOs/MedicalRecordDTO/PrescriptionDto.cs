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

        public string? GenericName { get; set; }
        public string? DosageForms { get; set; }
        public string? CommonUses { get; set; }
        public string? SideEffects { get; set; }
    }


    public class CreatePrescriptionDto
    {
        public string MedicationName { get; set; } = null!;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Instructions { get; set; }
        public DateTime? createdAt { get; set; }
    }
}
