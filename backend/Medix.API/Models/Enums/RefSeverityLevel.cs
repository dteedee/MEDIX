using System;
using System.Collections.Generic;
using Medix.API.Models.Entities;

namespace Medix.API.Models.Enums;

public partial class RefSeverityLevel
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public string ColorCode { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AISymptomAnalysis> AISymptomAnalyses { get; set; } = new List<AISymptomAnalysis>();
}
