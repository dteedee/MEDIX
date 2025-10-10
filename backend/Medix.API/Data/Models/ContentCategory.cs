using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class ContentCategory
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public Guid? ParentId { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ContentCategory> InverseParent { get; set; } = new List<ContentCategory>();

    public virtual ContentCategory? Parent { get; set; }

    public virtual ICollection<HealthArticle> Articles { get; set; } = new List<HealthArticle>();
}
