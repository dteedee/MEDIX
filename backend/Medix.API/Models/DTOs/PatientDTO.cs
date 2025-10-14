namespace Medix.API.Models.DTOs
{
    public class PatientDTO
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string MedicalRecordNumber { get; set; } = string.Empty;
        public string BloodType { get; set; } = string.Empty;
        public string? BloodTypeCode { get; set; }
        public decimal? Height { get; set; }
        public decimal? Weight { get; set; }
        public string? MedicalHistory { get; set; }
        public string? Allergies { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public bool IsActive { get; set; }

        public override string? ToString()
        {
            return base.ToString();
        }
    }
}
