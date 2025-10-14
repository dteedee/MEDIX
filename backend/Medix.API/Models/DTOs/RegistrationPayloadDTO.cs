namespace Medix.API.Models.DTOs
{
    public class RegistrationPayloadDTO
    {
        public RegisterRequestPatientDTO RegisterRequest { get; set; } = new();
        public PatientDTO PatientDTO { get; set; } = null!;
    }
}
