namespace Medix.API.DTOs
{
    public class HealthArticlePublicDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Summary { get; set; }
        public string Content { get; set; } = null!;
        public string? ThumbnailUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? AuthorName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public List<CategoryInfo> Categories { get; set; } = new();

        public class CategoryInfo
        {
            public string Name { get; set; } = null!;
            public string Slug { get; set; } = null!;
        }
    }

}
