namespace Medix.API.Models.DTOs.Admin
{
    public class AdminDashboardDto
    {
        public AdminDashboardSummaryDto Summary { get; set; } = new();
        public AdminDashboardGrowthDto Growth { get; set; } = new();
        public IEnumerable<AdminDashboardUserGrowthDto> UserGrowth { get; set; } = new List<AdminDashboardUserGrowthDto>();
        public IEnumerable<AdminDashboardAppointmentTrendDto> AppointmentTrends { get; set; } = new List<AdminDashboardAppointmentTrendDto>();
        public IEnumerable<AdminDashboardRevenueTrendDto> RevenueTrends { get; set; } = new List<AdminDashboardRevenueTrendDto>();
        public IEnumerable<AdminDashboardRecentActivityDto> RecentActivities { get; set; } = new List<AdminDashboardRecentActivityDto>();
        public IEnumerable<AdminDashboardTopSpecialtyDto> TopSpecialties { get; set; } = new List<AdminDashboardTopSpecialtyDto>();
    }

    public class AdminDashboardSummaryDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalDoctors { get; set; }
        public int ActiveDoctors { get; set; }
        public int TotalPatients { get; set; }
        public int TodayAppointments { get; set; }
        public int TotalAppointments { get; set; }
        public int TotalHealthArticles { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal MonthRevenue { get; set; }
        public double AverageRating { get; set; }
    }

    public class AdminDashboardGrowthDto
    {
        public double UsersGrowthPercentage { get; set; }
        public double DoctorsGrowthPercentage { get; set; }
        public double AppointmentsGrowthPercentage { get; set; }
        public double ArticlesGrowthPercentage { get; set; }
        public double RevenueGrowthPercentage { get; set; }
        public double TodayAppointmentsGrowthPercentage { get; set; }
    }

    public class AdminDashboardUserGrowthDto
    {
        public string Period { get; set; } = string.Empty;
        public int Users { get; set; }
        public int Doctors { get; set; }
        public int Patients { get; set; }
    }

    public class AdminDashboardAppointmentTrendDto
    {
        public string Period { get; set; } = string.Empty;
        public int Appointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int CancelledAppointments { get; set; }
    }

    public class AdminDashboardRevenueTrendDto
    {
        public string Period { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal ConsultationFee { get; set; }
        public decimal PlatformFee { get; set; }
    }

    public class AdminDashboardRecentActivityDto
    {
        public string ActivityType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
    }

    public class AdminDashboardTopSpecialtyDto
    {
        public string SpecialtyName { get; set; } = string.Empty;
        public int DoctorCount { get; set; }
        public int AppointmentCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}

