namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileDto
    {
        public string? doctorID { get; set; }

       public string? AvatarUrl { get; set; }
        public string FullName { get; set; }
        public decimal AverageRating { get; set; }
        public int NumberOfReviews { get; set; }
        public string Specialization { get; set; }
        public string? Biography { get; set; }
        public int[] RatingByStar { get; set; }
        public string? Education { get; set; }
        public List<ReviewDto> Reviews { get; set; }
        public List<DoctorScheduleDto> Schedules { get; set; }
    }

    public class ReviewDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? Date { get; set; }
    }

    public class DoctorScheduleDto
    {
        public Guid Id { get; set; }
        public Guid DoctorId { get; set; }
        public int DayOfWeek { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
  
    }
}

  