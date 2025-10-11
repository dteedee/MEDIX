using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class DoctorSchedule
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public int DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public bool IsAvailable { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
