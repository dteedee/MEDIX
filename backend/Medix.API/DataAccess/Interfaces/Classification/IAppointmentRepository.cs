using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IAppointmentRepository
    {
        Task<IEnumerable<Appointment>> GetAllAsync();
        Task<Appointment?> GetByIdAsync(Guid id);
        Task AddAsync(Appointment entity);
        Task UpdateAsync(Appointment entity);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<Appointment>> GetByDoctorAsync(Guid doctorId);
        Task<IEnumerable<Appointment>> GetByPatientAsync(Guid patientId);
        Task<IEnumerable<Appointment>> GetByDateAsync(DateTime date);
    }
}
