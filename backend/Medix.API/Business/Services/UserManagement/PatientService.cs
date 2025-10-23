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
                BloodTypeCode = patientDTO.BloodTypeCode,
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
                BloodTypeCode = savedPatient.BloodTypeCode ?? string.Empty,
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
            // Gọi phương thức repository bạn đã cung cấp
            var patientEntity = await _patientRepository.GetPatientByUserIdAsync(userId);

            if (patientEntity == null)
            {
                return null;
            }

            // Map thủ công Entity -> DTO (Nên dùng AutoMapper)
            return new PatientDTO
            {
                Id = patientEntity.Id,
                UserId = patientEntity.UserId,
                EmergencyContactName = patientEntity.EmergencyContactName,
                EmergencyContactPhone = patientEntity.EmergencyContactPhone
             
            };
        }
        public async Task<PatientDTO> UpdateAsync(Guid userId, PatientDTO patientDTO)
        {
         
            var patientEntity = await _patientRepository.GetPatientByUserIdAsync(userId);

            if (patientEntity == null)
            {
           
                throw new InvalidOperationException($"Không tìm thấy bệnh nhân với User ID: {userId}");
            }


            patientEntity.EmergencyContactName = patientDTO.EmergencyContactName;
            patientEntity.EmergencyContactPhone = patientDTO.EmergencyContactPhone;

            var updatedEntity = await _patientRepository.UpdatePatientAsync(patientEntity);

            return new PatientDTO
            {
                Id = updatedEntity.Id,
                UserId = updatedEntity.UserId,
                EmergencyContactName = updatedEntity.EmergencyContactName,
                EmergencyContactPhone = updatedEntity.EmergencyContactPhone

            };
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