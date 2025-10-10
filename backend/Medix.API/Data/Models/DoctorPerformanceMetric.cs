using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class DoctorPerformanceMetric
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public DateOnly MetricDate { get; set; }

    public int TotalAppointments { get; set; }

    public int CompletedAppointments { get; set; }

    public decimal CancellationRate { get; set; }

    public decimal AverageRating { get; set; }

    public int? ResponseTimeMinutes { get; set; }

    public decimal Revenue { get; set; }

    public decimal? PatientSatisfactionScore { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
