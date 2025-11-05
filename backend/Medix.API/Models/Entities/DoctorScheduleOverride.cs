using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class DoctorScheduleOverride
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public DateOnly OverrideDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public bool IsAvailable { get; set; }

    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string OverrideType { get; set; } = null!;

    public virtual Doctor Doctor { get; set; } = null!;
}
