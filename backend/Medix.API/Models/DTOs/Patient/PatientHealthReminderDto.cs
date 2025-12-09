using Medix.API.Business.Helper;
using Medix.API.Models.Enums;
using System.Text.Json.Serialization;

namespace Medix.API.Models.DTOs.Patient
{
    public class PatientHealthReminderDto
    {
        public Guid? Id { get; set; }

        public Guid? PatientId { get; set; }

        public string? ReminderTypeCode { get; set; } = null!;

        public string? Title { get; set; } = null!;

        public string? Description { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? ScheduledDate { get; set; }

        public bool? IsRecurring { get; set; }

        public string? RecurrencePattern { get; set; }

        public bool? IsCompleted { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? CompletedAt { get; set; }

        public Guid? RelatedAppointmentId { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? CreatedAt { get; set; }

    }
}
