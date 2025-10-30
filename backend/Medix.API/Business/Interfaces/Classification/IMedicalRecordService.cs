using Medix.API.Business.Helper;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IMedicalRecordService
    {
        Task<MedicalRecordDto?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<MedicalRecordDto> CreateAsync(CreateOrUpdateMedicalRecordDto dto);
        Task<MedicalRecordDto> UpdateAsync(CreateOrUpdateMedicalRecordDto dto);
        Task<List<MedicalRecord>> GetRecordsByUserIdAsync(Guid userId, MedicalRecordQuery query);
        Task<MedicalRecord?> GetRecordDetailsByIdAsync(Guid id);
    }
}
