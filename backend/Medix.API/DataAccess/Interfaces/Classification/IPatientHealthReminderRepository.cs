using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IPatientHealthReminderRepository
    {

        public Task<PatientHealthReminder> SendHealthReminderAsync(PatientHealthReminder reminder);

        public Task<List<PatientHealthReminder>> getReminderswithPatientID(Guid patientId);

          public Task updateReminder(PatientHealthReminder reminder);
     
    }
}
