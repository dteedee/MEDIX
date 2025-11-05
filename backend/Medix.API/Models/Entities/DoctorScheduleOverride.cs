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
    /// <summary>
    /// Loại ghi đè:
    /// true = AVAILABILITY (Ca làm thêm - bác sĩ có sẵn)
    /// false = UNAVAILABILITY (Nghỉ phép - bác sĩ không có sẵn)
    /// </summary>
    public bool OverrideType { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
