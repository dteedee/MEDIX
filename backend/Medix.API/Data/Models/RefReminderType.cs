using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class RefReminderType
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<PatientHealthReminder> PatientHealthReminders { get; set; } = new List<PatientHealthReminder>();
}
