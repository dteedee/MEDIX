using Medix.API.DataAccess;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.UserManagement
{
    public class PatientService : IPatientService
    {
        private readonly IPatientRepository _patientRepository;
        private readonly IUserRepository _userRepository;

        public PatientService(IPatientRepository patientRepository, IUserRepository userRepository)
        {
            _patientRepository = patientRepository;
            _userRepository = userRepository;
        }

        public async Task<PatientDTO> RegisterPatientAsync(PatientDTO patientDTO, Guid userId)
        {
            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MedicalRecordNumber = GenerateMedicalRecordNumber(),
                BloodTypeCode = patientDTO.BloodType,
                Height = patientDTO.Height,
                Weight = patientDTO.Weight,
                MedicalHistory = patientDTO.MedicalHistory,
                Allergies = patientDTO.Allergies,
                EmergencyContactName = patientDTO.EmergencyContactName,
                EmergencyContactPhone = patientDTO.EmergencyContactPhone,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var savedPatient = await _patientRepository.SavePatientAsync(patient);

            return new PatientDTO
            {
                Id = savedPatient.Id,
                UserId = savedPatient.UserId,
                MedicalRecordNumber = savedPatient.MedicalRecordNumber,
                BloodType = savedPatient.BloodTypeCode ?? string.Empty,
                Height = savedPatient.Height,
                Weight = savedPatient.Weight,
                MedicalHistory = savedPatient.MedicalHistory,
                Allergies = savedPatient.Allergies,
                EmergencyContactName = savedPatient.EmergencyContactName,
                EmergencyContactPhone = savedPatient.EmergencyContactPhone
            };
        }

        public async Task<PatientDTO?> GetByIdAsync(Guid id)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return null;
        }

        public async Task<PatientDTO?> GetByUserIdAsync(Guid userId)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return null;
        }

        public async Task<PatientDTO> UpdateAsync(Guid id, PatientDTO patientDTO)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            throw new NotImplementedException("Chức năng cập nhật bệnh nhân chưa được triển khai");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return false;
        }

        public async Task<IEnumerable<PatientDTO>> GetAllAsync()
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return new List<PatientDTO>();
        }

        private string GenerateMedicalRecordNumber()
        {
            var random = new Random();
            return $"MR{DateTime.Now:yyyyMMdd}{random.Next(1000, 9999)}";
        }
    }
}