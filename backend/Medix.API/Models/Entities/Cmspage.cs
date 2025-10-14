using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class Cmspage
{
    public Guid Id { get; set; }

    public string PageTitle { get; set; } = null!;

    public string PageSlug { get; set; } = null!;

    public string PageContent { get; set; } = null!;

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAt { get; set; }

    public Guid AuthorId { get; set; }

    public int ViewCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User Author { get; set; } = null!;
}
