namespace Medix.API.Models.DTOs.Manager
{
    
    public class ManagerDashboardDto
    {
       
        public ManagerDashboardSummaryDto Summary { get; set; } = new();
        public IEnumerable<ManagerDashboardDoctorDto> RecentDoctors { get; set; } = new List<ManagerDashboardDoctorDto>();
        public IEnumerable<ManagerDashboardRecentActivityDto> RecentActivities { get; set; } = new List<ManagerDashboardRecentActivityDto>();
        public IEnumerable<ManagerDashboardRecentFeedbackDto> RecentFeedbacks { get; set; } = new List<ManagerDashboardRecentFeedbackDto>();
    }
    public class ManagerDashboardSummaryDto
    {
        public int ActiveDoctors { get; set; }
        public int TodayAppointments { get; set; }
        public int TodayConfirmedAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int CancelledAppointments { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
    public class ManagerDashboardDoctorDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string SpecialtyName { get; set; } = string.Empty;
        public string Status { get; set; } = "Offline";
        public string StatusDisplayName { get; set; } = "Nghỉ";
        public bool IsAcceptingAppointments { get; set; }
    }
    public class ManagerDashboardRecentActivityDto
    {
        /// <summary>
        /// Loại hoạt động: "APPOINTMENT", "DOCTOR_REGISTRATION", "ARTICLE_PUBLISHED"
        /// </summary>
        public string ActivityType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
    }
    public class ManagerDashboardRecentFeedbackDto
    {
        public Guid ReviewId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public Guid DoctorId { get; set; }
        public string SpecialtyName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}

