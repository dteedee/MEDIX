using Medix.API.Models.DTOs.MedicalRecordDTO;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IPrescriptionService
    {
        Task<IEnumerable<PrescriptionDto>> GetByMedicalRecordIdAsync(Guid medicalRecordId);
        Task<PrescriptionDto?> GetByIdAsync(Guid id);
        Task<PrescriptionDto> CreateAsync(Guid medicalRecordId, CreatePrescriptionDto dto);
        Task<PrescriptionDto?> UpdateAsync(Guid id, CreatePrescriptionDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
