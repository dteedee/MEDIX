using Medix.API.Application.DTO;
using Medix.API.Data.DTO.Medix.API.Data.DTO;

namespace Medix.API.Utils.Payload;

public class RegistrationPayload
{
    public RegisterDTO RegisterDTo { get; set; } = null!;
    public PatientDTO PatientDTO { get; set; } = null!;
}