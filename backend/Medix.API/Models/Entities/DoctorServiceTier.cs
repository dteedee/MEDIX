using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class DoctorServiceTier
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal ConsultationFeeMultiplier { get; set; }

    public int PriorityBoost { get; set; }

    public int MaxDailyAppointments { get; set; }

    public string? Features { get; set; }

    public decimal MonthlyPrice { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();

    public virtual ICollection<ServiceTierSubscription> ServiceTierSubscriptions { get; set; } = new List<ServiceTierSubscription>();
}
