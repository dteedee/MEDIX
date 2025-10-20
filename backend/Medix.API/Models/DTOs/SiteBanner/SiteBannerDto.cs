namespace Medix.API.Models.DTOs.SiteBanner
{
    public class SiteBannerDto
    {
        public Guid Id { get; set; }
        public string BannerTitle { get; set; } = string.Empty;
        public string BannerImageUrl { get; set; } = string.Empty;
        public string? BannerUrl { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
