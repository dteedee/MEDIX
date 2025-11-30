using Medix.API.Models.DTOs.Patient;

namespace Medix.API.Models.DTOs.Authen
{
    public class RegistrationPayloadDTO
    {
        public RegisterRequestPatientDTO RegisterRequest { get; set; } = new();
        public PatientDTO PatientDTO { get; set; } = null!;
    }
}
