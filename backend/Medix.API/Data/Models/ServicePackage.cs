using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class ServicePackage
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public string? Features { get; set; }

    public bool IsActive { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<DoctorSubscription> DoctorSubscriptions { get; set; } = new List<DoctorSubscription>();
}
