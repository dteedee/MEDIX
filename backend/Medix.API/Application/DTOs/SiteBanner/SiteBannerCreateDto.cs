namespace Medix.API.DTOs
{
    public class SiteBannerCreateDto
    {
        public string BannerTitle { get; set; } = null!;
        public string BannerImageUrl { get; set; } = null!;
        public string? BannerUrl { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }
}
