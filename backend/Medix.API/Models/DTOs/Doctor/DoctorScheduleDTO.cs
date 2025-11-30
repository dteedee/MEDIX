using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorScheduleWorkDto
    {
        public Guid Id { get; set; }
        public string DoctorName { get; set; } = string.Empty;  // 👈 thay DoctorId bằng tên bác sĩ
        public int DayOfWeek { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    public class CreateDoctorScheduleDto
    {
        [Required]
        public Guid DoctorId { get; set; }

        [Range(1, 7, ErrorMessage = "DayOfWeek phải nằm trong khoảng 1 (Thứ Hai) đến 7 (Chủ Nhật).")]
        public int DayOfWeek { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;
    }
    public class UpdateDoctorScheduleDto
    {
        [Required]
        public Guid Id { get; set; } 

        [Required]
        public Guid DoctorId { get; set; }

        [Range(1, 7, ErrorMessage = "DayOfWeek phải nằm trong khoảng 1 (Thứ Hai) đến 7 (Chủ Nhật).")]
        public int DayOfWeek { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;
    }
}
