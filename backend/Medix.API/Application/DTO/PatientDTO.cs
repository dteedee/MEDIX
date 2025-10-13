namespace Medix.API.Data.DTO
{
    namespace Medix.API.Data.DTO
    {
        public class PatientDTO
        {
            public Guid Id { get; set; }
            public string? BloodTypeCode { get; set; }
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
}