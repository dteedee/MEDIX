namespace Medix.API.Models.DTOs.Manager
{
    /// <summary>
    /// DTO chính cho Manager Dashboard
    /// </summary>
    public class ManagerDashboardDto
    {
        /// <summary>
        /// Thống kê tổng quan của dashboard
        /// </summary>
        public ManagerDashboardSummaryDto Summary { get; set; } = new();

        /// <summary>
        /// Danh sách bác sĩ gần đây (tối đa 10)
        /// </summary>
        public IEnumerable<ManagerDashboardDoctorDto> RecentDoctors { get; set; } = new List<ManagerDashboardDoctorDto>();

        /// <summary>
        /// Danh sách hoạt động gần đây (tối đa 10)
        /// </summary>
        public IEnumerable<ManagerDashboardRecentActivityDto> RecentActivities { get; set; } = new List<ManagerDashboardRecentActivityDto>();

        /// <summary>
        /// Danh sách feedback gần đây từ bệnh nhân cho bác sĩ (tối đa 10)
        /// </summary>
        public IEnumerable<ManagerDashboardRecentFeedbackDto> RecentFeedbacks { get; set; } = new List<ManagerDashboardRecentFeedbackDto>();
    }

    /// <summary>
    /// Thống kê tổng quan cho Manager Dashboard
    /// </summary>
    public class ManagerDashboardSummaryDto
    {
        /// <summary>
        /// Số bác sĩ có ca làm việc trong ngày hôm nay (theo lịch thường xuyên hoặc override)
        /// </summary>
        public int ActiveDoctors { get; set; }

        /// <summary>
        /// Tổng số lịch hẹn hôm nay (tất cả trạng thái)
        /// </summary>
        public int TodayAppointments { get; set; }

        /// <summary>
        /// Số lịch hẹn đã xác nhận hôm nay (Confirmed hoặc InProgress)
        /// </summary>
        public int TodayConfirmedAppointments { get; set; }

        /// <summary>
        /// Đánh giá trung bình từ tất cả các đánh giá (0-5)
        /// </summary>
        public double AverageRating { get; set; }

        /// <summary>
        /// Tổng số đánh giá trong hệ thống
        /// </summary>
        public int TotalReviews { get; set; }
    }

    /// <summary>
    /// Thông tin bác sĩ hiển thị trên dashboard
    /// </summary>
    public class ManagerDashboardDoctorDto
    {
        /// <summary>
        /// ID của bác sĩ
        /// </summary>
        public Guid DoctorId { get; set; }

        /// <summary>
        /// Tên đầy đủ của bác sĩ
        /// </summary>
        public string DoctorName { get; set; } = string.Empty;

        /// <summary>
        /// Tên chuyên khoa
        /// </summary>
        public string SpecialtyName { get; set; } = string.Empty;

        /// <summary>
        /// Trạng thái hiện tại: "Online", "Busy", "Offline"
        /// </summary>
        public string Status { get; set; } = "Offline";

        /// <summary>
        /// Tên hiển thị trạng thái: "Đang hoạt động", "Bận", "Nghỉ"
        /// </summary>
        public string StatusDisplayName { get; set; } = "Nghỉ";

        /// <summary>
        /// Bác sĩ có đang nhận lịch hẹn mới không
        /// </summary>
        public bool IsAcceptingAppointments { get; set; }
    }

    /// <summary>
    /// Hoạt động gần đây trên dashboard
    /// </summary>
    public class ManagerDashboardRecentActivityDto
    {
        /// <summary>
        /// Loại hoạt động: "APPOINTMENT", "DOCTOR_REGISTRATION", "ARTICLE_PUBLISHED"
        /// </summary>
        public string ActivityType { get; set; } = string.Empty;

        /// <summary>
        /// Tiêu đề hoạt động
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Mô tả chi tiết hoạt động
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Thời gian tạo hoạt động (UTC)
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Tên người dùng liên quan (nếu có)
        /// </summary>
        public string? UserName { get; set; }
    }

    /// <summary>
    /// Feedback gần đây từ bệnh nhân cho bác sĩ
    /// </summary>
    public class ManagerDashboardRecentFeedbackDto
    {
        /// <summary>
        /// ID của feedback/review
        /// </summary>
        public Guid ReviewId { get; set; }

        /// <summary>
        /// Đánh giá (1-5 sao)
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Bình luận của bệnh nhân
        /// </summary>
        public string? Comment { get; set; }

        /// <summary>
        /// Tên bệnh nhân đánh giá
        /// </summary>
        public string PatientName { get; set; } = string.Empty;

        /// <summary>
        /// Tên bác sĩ được đánh giá
        /// </summary>
        public string DoctorName { get; set; } = string.Empty;

        /// <summary>
        /// ID của bác sĩ
        /// </summary>
        public Guid DoctorId { get; set; }

        /// <summary>
        /// Chuyên khoa của bác sĩ
        /// </summary>
        public string SpecialtyName { get; set; } = string.Empty;

        /// <summary>
        /// Thời gian tạo feedback (UTC)
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }
}

