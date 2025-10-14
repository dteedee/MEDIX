using Medix.API.Models.Entities;

using System;
using System.Collections.Generic;

namespace Medix.API.Models.Enums;

public partial class RefAppointmentStatus
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public bool IsTerminal { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AppointmentStatusHistory> AppointmentStatusHistoryNewStatusCodeNavigations { get; set; } = new List<AppointmentStatusHistory>();

    public virtual ICollection<AppointmentStatusHistory> AppointmentStatusHistoryOldStatusCodeNavigations { get; set; } = new List<AppointmentStatusHistory>();

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
