using Medix.API.Models.Enums;

namespace Medix.API.Models.DTOs.Patient
{
    public class PatientHealthReminderDto
    {
        public Guid? Id { get; set; }

        public Guid? PatientId { get; set; }

        public string? ReminderTypeCode { get; set; } = null!;

        public string? Title { get; set; } = null!;

        public string? Description { get; set; }

        public DateTime? ScheduledDate { get; set; }

        public bool? IsRecurring { get; set; }

        public string? RecurrencePattern { get; set; }

        public bool? IsCompleted { get; set; }

        public DateTime? CompletedAt { get; set; }

        public Guid? RelatedAppointmentId { get; set; }

        public DateTime? CreatedAt { get; set; }

    }
}
