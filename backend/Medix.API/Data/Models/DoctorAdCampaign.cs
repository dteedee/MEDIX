using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class DoctorAdCampaign
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public string CampaignName { get; set; } = null!;

    public string CampaignType { get; set; } = null!;

    public decimal Budget { get; set; }

    public decimal DailySpendLimit { get; set; }

    public decimal TotalSpent { get; set; }

    public int Impressions { get; set; }

    public int Clicks { get; set; }

    public int Conversions { get; set; }

    public string Status { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string? TargetSpecializations { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
