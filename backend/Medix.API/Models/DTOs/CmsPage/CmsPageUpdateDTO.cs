using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.CMSPage
{
    public class CmspageUpdateDto
    {
        [Required(ErrorMessage = "Page title is required.")]
        [StringLength(150, ErrorMessage = "Page title cannot exceed 150 characters.")]
        public string PageTitle { get; set; } = null!;

        [Required(ErrorMessage = "Page slug is required.")]
        [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Page slug must be URL-friendly (lowercase letters, numbers, and dashes only).")]
        [StringLength(150, ErrorMessage = "Page slug cannot exceed 150 characters.")]
        public string PageSlug { get; set; } = null!;

        [Required(ErrorMessage = "Page content is required.")]
        public string PageContent { get; set; } = null!;

        [StringLength(70, ErrorMessage = "Meta title cannot exceed 70 characters.")]
        public string? MetaTitle { get; set; }

        [StringLength(160, ErrorMessage = "Meta description cannot exceed 160 characters.")]
        public string? MetaDescription { get; set; }

        public bool IsPublished { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime? PublishedAt { get; set; }

        [Required(ErrorMessage = "Author ID is required.")]
        public Guid AuthorId { get; set; }
    }
}
