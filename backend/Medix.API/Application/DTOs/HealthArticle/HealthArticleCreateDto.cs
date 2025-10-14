namespace Medix.API.DTOs
{
    public class HealthArticleCreateDto
    {
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
        public DateTime? PublishedAt { get; set; }
        public List<Guid> CategoryIds { get; set; } = new();
    }
}
