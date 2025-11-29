using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IPatientHealthReminderService
    {
        Task<List<PatientHealthReminder>> SendHealthReminderAppointmentAsync(AppointmentDto createAppointment);
        Task ExecuteSendReminderAsync(PatientHealthReminder healthReminder);
        Task<PatientHealthReminder> sendHealthReminderPrescription(List<Prescription> prescription);
        Task<PatientHealthReminder> CreateHealthReminder(PatientHealthReminder healthReminder);
        Task<List<PatientHealthReminderDto>> getReminderswithPatientID(Guid patientId);

        Task<PatientHealthReminderDto> updateReminder(PatientHealthReminderDto reminder);

    }
}