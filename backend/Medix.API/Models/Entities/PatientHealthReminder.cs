using System;
using System.Collections.Generic;
using Medix.API.Models.Enums;

namespace Medix.API.Models.Entities;

public partial class PatientHealthReminder
{
    public Guid Id { get; set; }

    public Guid PatientId { get; set; }

    public string ReminderTypeCode { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime ScheduledDate { get; set; }

    public bool IsRecurring { get; set; }

    public string? RecurrencePattern { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }

    public Guid? RelatedAppointmentId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Patient Patient { get; set; } = null!;

    public virtual Appointment? RelatedAppointment { get; set; }

    public virtual RefReminderType ReminderTypeCodeNavigation { get; set; } = null!;
}
