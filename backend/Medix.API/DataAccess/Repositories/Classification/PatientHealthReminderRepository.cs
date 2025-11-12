using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class PatientHealthReminderRepository : IPatientHealthReminderRepository
    {
        private readonly MedixContext _context;

        public PatientHealthReminderRepository(MedixContext context)
        {
            _context = context;
        }

       

       public async Task<PatientHealthReminder> SendHealthReminderAsync(PatientHealthReminder reminder)
        {
           await _context.PatientHealthReminders.AddAsync(reminder);
            await  _context.SaveChangesAsync();
            return reminder;
        }
    }
}
