using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class Specialization
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AISymptomAnalysis> AISymptomAnalyses { get; set; } = new List<AISymptomAnalysis>();

    public virtual ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}
