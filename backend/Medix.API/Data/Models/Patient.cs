using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class Patient
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string MedicalRecordNumber { get; set; } = null!;

    public string? BloodType { get; set; }

    public decimal? Height { get; set; }

    public decimal? Weight { get; set; }

    public string? MedicalHistory { get; set; }

    public string? Allergies { get; set; }

    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<AisymptomAnalysis> AisymptomAnalyses { get; set; } = new List<AisymptomAnalysis>();

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual User User { get; set; } = null!;
}
