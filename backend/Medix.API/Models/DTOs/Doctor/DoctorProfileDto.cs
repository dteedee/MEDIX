namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileDto
    {
        public string? AvatarUrl { get; set; }
        public string FullName { get; set; }
        public decimal AverageRating { get; set; }
        public int NumberOfReviews { get; set; }
        public string Specialization { get; set; }
        public string? Biography { get; set; }
        public int[] RatingByStar { get; set; }
        public string? Education { get; set; }
        public List<ReviewDto> Reviews { get; set; }
    }

    public class ReviewDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? Date { get; set; }
    }
}
