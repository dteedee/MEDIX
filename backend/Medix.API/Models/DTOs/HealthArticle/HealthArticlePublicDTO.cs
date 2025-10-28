namespace Medix.API.Models.DTOs.HealthArticle
{
    public class HealthArticlePublicDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Summary { get; set; }
        public string? Content { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string StatusCode { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public bool IsHomepageVisible { get; set; }
        public int DisplayOrder { get; set; }
        public string DisplayType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<CategoryInfo> Categories { get; set; } = new();

        public class CategoryInfo
        {
            public Guid Id { get; set; }
            public string Name { get; set; } = null!;
            public string Slug { get; set; } = null!;
        }
    }
}
