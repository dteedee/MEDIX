using System;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.ContentCategory
{
    public class ContentCategoryCreateDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Slug is required.")]
        [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug must be URL-friendly (lowercase letters, numbers, and dashes only).")]
        [StringLength(100, ErrorMessage = "Slug cannot exceed 100 characters.")]
        public string Slug { get; set; } = null!;

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters.")]
        public string? Description { get; set; }

        public Guid? ParentId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
