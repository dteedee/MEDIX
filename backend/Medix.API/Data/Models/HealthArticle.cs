using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class HealthArticle
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Summary { get; set; }

    public string Content { get; set; } = null!;

    public string DisplayType { get; set; } = null!;

    public string? ThumbnailUrl { get; set; }

    public string? CoverImageUrl { get; set; }

    public bool IsHomepageVisible { get; set; }

    public int DisplayOrder { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public Guid AuthorId { get; set; }

    public string StatusCode { get; set; } = null!;

    public int ViewCount { get; set; }

    public int LikeCount { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User Author { get; set; } = null!;

    public virtual RefArticleStatus StatusCodeNavigation { get; set; } = null!;

    public virtual ICollection<ContentCategory> Categories { get; set; } = new List<ContentCategory>();
}
