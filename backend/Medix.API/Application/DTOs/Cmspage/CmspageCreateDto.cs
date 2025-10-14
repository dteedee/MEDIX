namespace Medix.API.DTOs
{
    public class CmspageCreateDto
    {
        public string PageTitle { get; set; } = null!;
        public string PageSlug { get; set; } = null!;
        public string PageContent { get; set; } = null!;
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
        public Guid AuthorId { get; set; }
    }
}
