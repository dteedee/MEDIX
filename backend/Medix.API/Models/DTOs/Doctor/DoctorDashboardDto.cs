﻿namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorDashboardDto
    {
        public DashboardSummaryDto Summary { get; set; } = new();
        public DashboardScheduleDto Schedule { get; set; } = new();
        public DashboardSubscriptionDto? Subscription { get; set; }
        public DashboardWalletDto? Wallet { get; set; }
        public IEnumerable<DashboardCampaignDto> Campaigns { get; set; } = new List<DashboardCampaignDto>();
        public DashboardSalaryDto? Salary { get; set; }
        public DashboardReviewDto Reviews { get; set; } = new();
    }

    public class DashboardSummaryDto
    {
        public int TodayAppointments { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal MonthRevenue { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
    }

    public class DashboardScheduleDto
    {
        public IEnumerable<object> Regular { get; set; } = new List<object>();
        public IEnumerable<object> Overrides { get; set; } = new List<object>();
    }

    public class DashboardSubscriptionDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Features { get; set; }
        public decimal MonthlyFee { get; set; }
    }

    public class DashboardWalletDto
    {
        public decimal Balance { get; set; }
    }

    public class DashboardCampaignDto
    {
        public string CampaignName { get; set; } = string.Empty;
        public int Impressions { get; set; }
        public int Clicks { get; set; }
        public int Conversions { get; set; }
        public decimal TotalSpent { get; set; }
    }

    public class DashboardSalaryDto
    {
        public DateOnly PeriodStartDate { get; set; }
        public DateOnly PeriodEndDate { get; set; }
        public decimal NetSalary { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class DashboardReviewDto
    {
        public double AverageRating { get; set; }
        public IEnumerable<DashboardReviewItemDto> Recent { get; set; } = new List<DashboardReviewItemDto>();
    }

    public class DashboardReviewItemDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }



    public class StatDto
    {
        public long Total { get; set; }
        public decimal Growth { get; set; } // percentage, e.g. 12.5
    }

    public class ManagerDashboardSummaryDto
    {
        public StatDto Users { get; set; } = new();
        public StatDto Doctors { get; set; } = new();
        public StatDto Appointments { get; set; } = new();
        public StatDto Revenue { get; set; } = new(); // revenue in smallest currency unit / decimal
    }
}
