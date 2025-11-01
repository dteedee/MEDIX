namespace Medix.API.Models.DTOs.ReviewDTO
{
    public class ReviewDoctorDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid DoctorId { get; set; }
        public string? DoctorName { get; set; }
        public string? PatientName { get; set; }


        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? AdminResponse { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
