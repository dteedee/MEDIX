namespace Medix.API.Models.DTOs.ReviewDTO
{
    public class UpdateReviewDto
    {
        public Guid AppointmentId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
