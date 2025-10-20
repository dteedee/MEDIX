using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.HealthArticle
{
    public class HealthArticleUpdateDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [StringLength(150, ErrorMessage = "Title cannot exceed 150 characters.")]
        public string Title { get; set; } = null!;

        [Required(ErrorMessage = "Slug is required.")]
        [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$",
            ErrorMessage = "Slug must be URL-friendly (lowercase letters, numbers, and dashes only).")]
        [StringLength(150, ErrorMessage = "Slug cannot exceed 150 characters.")]
        public string Slug { get; set; } = null!;

        [StringLength(255, ErrorMessage = "Summary cannot exceed 255 characters.")]
        public string? Summary { get; set; }

        [Required(ErrorMessage = "Content is required.")]
        public string Content { get; set; } = null!;

        [Required(ErrorMessage = "DisplayType is required.")]
       
        public string DisplayType { get; set; } = null!;

        public string? ThumbnailUrl { get; set; }

        public string? CoverImageUrl { get; set; }

        public bool IsHomepageVisible { get; set; }

        [Range(0, 9999, ErrorMessage = "DisplayOrder must be between 0 and 9999.")]
        public int DisplayOrder { get; set; }

        [StringLength(70, ErrorMessage = "MetaTitle cannot exceed 70 characters.")]
        public string? MetaTitle { get; set; }

        [StringLength(160, ErrorMessage = "MetaDescription cannot exceed 160 characters.")]
        public string? MetaDescription { get; set; }

        [Required(ErrorMessage = "AuthorId is required.")]
        public Guid AuthorId { get; set; }

        [Required(ErrorMessage = "StatusCode is required.")]
        
        public string StatusCode { get; set; } = null!;

        public DateTime? PublishedAt { get; set; }

        [Required(ErrorMessage = "At least one category must be selected.")]
        [MinLength(1, ErrorMessage = "At least one category must be selected.")]
        public List<Guid> CategoryIds { get; set; } = new();
    }
}
