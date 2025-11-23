using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class Promotion
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string DiscountType { get; set; } = null!;

    public decimal DiscountValue { get; set; }

    public int? MaxUsage { get; set; }

    public int UsedCount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    // New column: stores the target audience for this promotion.
    // Suggested format: comma-separated tokens, e.g. "All", "New", "VIP", "New,VIP"
    // You can change to enum/int/bitmask later if you prefer.
    public string? ApplicableTargets { get; set; }

    public virtual ICollection<UserPromotion> UserPromotions { get; set; } = new List<UserPromotion>();
}
