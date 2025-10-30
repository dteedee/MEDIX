using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class Specialization
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<AISymptomAnalysis> AISymptomAnalyses { get; set; } = new List<AISymptomAnalysis>();

    public virtual ICollection<DoctorRegistrationForm> DoctorRegistrationForms { get; set; } = new List<DoctorRegistrationForm>();

    public virtual ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}
