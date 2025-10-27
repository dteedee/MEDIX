using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorScheduleDto
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

        [Range(0, 6, ErrorMessage = "DayOfWeek phải nằm trong khoảng 0 (Chủ Nhật) đến 6 (Thứ Bảy).")]
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

        [Range(0, 6, ErrorMessage = "DayOfWeek phải nằm trong khoảng 0 (Chủ Nhật) đến 6 (Thứ Bảy).")]
        public int DayOfWeek { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;
    }
}
