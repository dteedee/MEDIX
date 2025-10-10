using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class AisymptomAnalysis
{
    public Guid Id { get; set; }

    public string SessionId { get; set; } = null!;

    public Guid? PatientId { get; set; }

    public string Symptoms { get; set; } = null!;

    public string? UploadedEmrurl { get; set; }

    public string? Emrtext { get; set; }

    public string SeverityLevel { get; set; } = null!;

    public string? PossibleConditions { get; set; }

    public string? RecommendedAction { get; set; }

    public decimal? ConfidenceScore { get; set; }

    public Guid? RecommendedSpecializationId { get; set; }

    public bool IsGuestSession { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual Patient? Patient { get; set; }

    public virtual Specialization? RecommendedSpecialization { get; set; }
}
