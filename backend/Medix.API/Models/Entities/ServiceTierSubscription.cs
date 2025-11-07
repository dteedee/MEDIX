using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class ServiceTierSubscription
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public Guid ServiceTierId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;

    public virtual DoctorServiceTier ServiceTier { get; set; } = null!;
}
