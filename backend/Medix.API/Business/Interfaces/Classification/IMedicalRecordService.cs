using Medix.API.Models.DTOs.MedicalRecordDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IMedicalRecordService
    {
        Task<MedicalRecordDto?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<MedicalRecordDto> CreateAsync(CreateOrUpdateMedicalRecordDto dto);
        Task<MedicalRecordDto> UpdateAsync(CreateOrUpdateMedicalRecordDto dto);
    }
}
