using Medix.API.Application.DTO;
using Medix.API.Data.DTO.Medix.API.Data.DTO;

namespace Medix.API.Application.DTOs;

public class RegistrationPayload
{
    public RegisterRequestPatientDto RegisterDTo { get; set; } = null!;
    public PatientDTO PatientDTO { get; set; } = null!;
}