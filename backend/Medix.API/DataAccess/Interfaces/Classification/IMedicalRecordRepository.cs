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

    }
}
