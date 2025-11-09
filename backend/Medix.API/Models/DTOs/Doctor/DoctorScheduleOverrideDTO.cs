namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorScheduleOverrideDto
    {
        public Guid Id { get; set; }
        public Guid DoctorId { get; set; }
        public DateOnly OverrideDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool OverrideType { get; set; }

    }

    public class CreateDoctorScheduleOverrideDto
    {
        public Guid DoctorId { get; set; }
        public DateOnly OverrideDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public string? Reason { get; set; }
        public bool OverrideType { get; set; }

    }

    public class UpdateDoctorScheduleOverrideDto
    {
        public Guid Id { get; set; }
        public DateOnly OverrideDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public string? Reason { get; set; }
        public bool OverrideType { get; set; }

    }
}
