using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.SiteBanner
{
    public class SiteBannerUpdateDto
    {
        [Required(ErrorMessage = "Banner title is required.")]
        [StringLength(150, ErrorMessage = "Banner title cannot exceed 150 characters.")]
        public string BannerTitle { get; set; } = null!;

        public string BannerImageUrl { get; set; } = null!;

        [Url(ErrorMessage = "Banner URL must be a valid URL.")]
        public string? BannerUrl { get; set; }

        [Range(0, 9999, ErrorMessage = "Display order must be between 0 and 9999.")]
        public int DisplayOrder { get; set; }

        [Required(ErrorMessage = "Start date is required.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End date is required.")]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; }
    }
}
