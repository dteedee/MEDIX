namespace Medix.API.Models.DTOs.AIChat
{
    public class RecommendedArticleDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
    }
}
