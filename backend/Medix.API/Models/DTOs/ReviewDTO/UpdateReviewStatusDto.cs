namespace Medix.API.Models.DTOs.ReviewDTO
{
    public class UpdateReviewStatusDto
    {
        public Guid ReviewId { get; set; }
        public string Status { get; set; } = null!;
    }
}

