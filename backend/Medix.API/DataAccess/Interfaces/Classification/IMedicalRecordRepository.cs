using Medix.API.Business.Helper;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IMedicalRecordRepository
    {
        Task<MedicalRecord?> GetByPatientIdAsync(Guid patientId);
        Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId);
        Task AddAsync(MedicalRecord record);
        Task UpdateAsync(MedicalRecord record);
        IQueryable<MedicalRecord> Query();

        Task<List<MedicalRecord>> GetRecordsByUserIdAsync(Guid userId, MedicalRecordQuery query);
        Task<MedicalRecord?> GetRecordDetailsByIdAsync(Guid id);
    }
}
