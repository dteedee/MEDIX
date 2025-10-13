using Medix.API.Data.DTO;
using Medix.API.Data.DTO.Medix.API.Data.DTO;
using Medix.API.Data.Models;
using Medix.API.Data.Repositories;

namespace Medix.API.Application.Services
{
    public interface IPatientService
    {
        public Task<PatientDTO> RegisterPatientAsync(PatientDTO patientDTO, Guid userID);
    }
    public class PatientService : IPatientService
    {
     
        private readonly IPatientRepository _patientRepository;

        public PatientService(IPatientRepository patientRepository)
        {
            _patientRepository = patientRepository;
        }

        public async Task<PatientDTO> RegisterPatientAsync(PatientDTO patientDTO,Guid userID)
        {
            // Tạo mới đối tượng Patient từ PatientDTO
            var patient = new Patient
            {
                BloodTypeCode = patientDTO.BloodTypeCode,
                UserId = userID,
                EmergencyContactName = patientDTO.EmergencyContactName,
                EmergencyContactPhone = patientDTO.EmergencyContactPhone,
                MedicalRecordNumber = Guid.NewGuid().ToString() 
            };
            var savedPatient = await _patientRepository.SavePatientAsync(patient);

            var result = new PatientDTO
            {
                Id = savedPatient.Id,
                BloodTypeCode = savedPatient.BloodTypeCode,
                EmergencyContactName = savedPatient.EmergencyContactName,
                EmergencyContactPhone = savedPatient.EmergencyContactPhone,
          
           
            };

            return result;
        }
    }
}
