namespace Medix.API.DTOs
{
    public class ContentCategoryUpdateDto
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public Guid? ParentId { get; set; }
        public bool IsActive { get; set; }
    }
}
