namespace Medix.API.DTOs
{
    public class ContentCategoryDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public Guid? ParentId { get; set; }
        public string? ParentName { get; set; }
    }
}
