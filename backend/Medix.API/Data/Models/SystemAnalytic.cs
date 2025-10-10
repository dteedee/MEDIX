using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class SystemAnalytic
{
    public Guid Id { get; set; }

    public DateOnly MetricDate { get; set; }

    public string MetricType { get; set; } = null!;

    public decimal MetricValue { get; set; }

    public string? Dimension1 { get; set; }

    public string? Dimension2 { get; set; }

    public DateTime CreatedAt { get; set; }
}
