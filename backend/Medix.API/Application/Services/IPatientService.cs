using Medix.API.Data.DTO.Medix.API.Data.DTO;

namespace Medix.API.Application.Services
{
    public interface IPatientService
    {
        public Task<PatientDTO> RegisterPatientAsync(PatientDTO patientDTO, Guid userID);
    }
}
