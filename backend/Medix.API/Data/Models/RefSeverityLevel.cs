using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class RefSeverityLevel
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public string ColorCode { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AISymptomAnalysis> AISymptomAnalyses { get; set; } = new List<AISymptomAnalysis>();
}
