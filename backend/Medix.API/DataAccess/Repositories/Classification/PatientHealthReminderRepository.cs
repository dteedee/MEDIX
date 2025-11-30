using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class PatientHealthReminderRepository : IPatientHealthReminderRepository
    {
        private readonly MedixContext _context;

        public PatientHealthReminderRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<PatientHealthReminder>> getReminderswithPatientID(Guid patientId)
        {
            return await _context.PatientHealthReminders
                    .Where(r => r.PatientId == patientId && r.IsCompleted == false)
                    .ToListAsync();
        }

        public async Task<PatientHealthReminder> SendHealthReminderAsync(PatientHealthReminder reminder)
        {
            await _context.PatientHealthReminders.AddAsync(reminder);
            await _context.SaveChangesAsync();
            return reminder;
        }

        public async Task updateReminder(PatientHealthReminder reminder)
        {
             _context.PatientHealthReminders.Update(reminder);
            await _context.SaveChangesAsync();
        }
    }
}
