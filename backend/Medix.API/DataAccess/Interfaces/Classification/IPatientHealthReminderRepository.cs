using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IPatientHealthReminderRepository
    {

        public Task<PatientHealthReminder> SendHealthReminderAsync(PatientHealthReminder reminder);
    }
}
