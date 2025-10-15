using System;
using System.Collections.Generic;
using Medix.API.Models.Enums;

namespace Medix.API.Models.Entities;

public partial class AppointmentStatusHistory
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }

    public string? OldStatusCode { get; set; }

    public string NewStatusCode { get; set; } = null!;

    public Guid ChangedBy { get; set; }

    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;

    public virtual User ChangedByNavigation { get; set; } = null!;

    public virtual RefAppointmentStatus NewStatusCodeNavigation { get; set; } = null!;

    public virtual RefAppointmentStatus? OldStatusCodeNavigation { get; set; }
}
