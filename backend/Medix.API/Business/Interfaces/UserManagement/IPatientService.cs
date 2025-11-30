using Medix.API.Models.DTOs.Patient;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IPatientService
    {
        Task<PatientDTO> RegisterPatientAsync(PatientDTO patientDTO, Guid userId);
        Task<PatientDTO?> GetByIdAsync(Guid id);
        Task<PatientDTO?> GetByUserIdAsync(Guid userId);
        Task<PatientDTO> UpdateAsync(Guid id, PatientDTO patientDTO);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<PatientDTO>> GetAllAsync();
        Task<Patient?> GetPatientByUserIdAsync(Guid userId);
    }
}