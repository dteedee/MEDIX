﻿using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorDashboardRepository : IDoctorDashboardRepository
    {
        private readonly MedixContext _context;

        public DoctorDashboardRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<DoctorDashboardDto> GetDashboardAsync(Guid doctorId)
        {
            var today = DateTime.Today;
            var monthStart = new DateTime(today.Year, today.Month, 1);

            // Lấy thông tin user từ doctorId để truy vấn ví
            var doctorUser = await _context.Doctors
                .AsNoTracking()
                .Where(d => d.Id == doctorId)
                .Select(d => new { d.UserId })
                .FirstOrDefaultAsync();

            var todayAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentStartTime.Date == today)
                .ToListAsync();

            var todayRevenue = todayAppointments.Sum(a => a.TotalAmount);
            var monthRevenue = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && a.AppointmentStartTime >= monthStart)
                .SumAsync(a => a.TotalAmount);

            var totalRevenue = await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .SumAsync(a => a.TotalAmount);

            var avgRating = await _context.Reviews
                .Where(r => r.Appointment.DoctorId == doctorId)
                .AverageAsync(r => (double?)r.Rating) ?? 0;

            var regularSchedule = await _context.DoctorSchedules
                .Where(s => s.DoctorId == doctorId && s.DayOfWeek == (int)today.DayOfWeek)
                .Select(s => new
                {
                    s.DayOfWeek,
                    s.StartTime,
                    s.EndTime,
                    s.IsAvailable
                }).ToListAsync();

            var overrides = await _context.DoctorScheduleOverrides
                .Where(o => o.DoctorId == doctorId && o.OverrideDate == DateOnly.FromDateTime(today))
                .Select(o => new
                {
                    o.OverrideDate,
                    o.StartTime,
                    o.EndTime,
                    o.IsAvailable,
                    o.OverrideType,
                    o.Reason
                }).ToListAsync();

            var activeSubscription = await _context.DoctorSubscriptions
                .Include(s => s.ServicePackage)
                .Where(s => s.DoctorId == doctorId && s.Status == "ACTIVE" && s.EndDate >= today)
                .OrderByDescending(s => s.StartDate)
                .FirstOrDefaultAsync();

            var activeCampaigns = await _context.DoctorAdCampaigns
                .Where(c => c.DoctorId == doctorId && c.Status == "ACTIVE")
                .Select(c => new DashboardCampaignDto
                {
                    CampaignName = c.CampaignName,
                    Impressions = c.Impressions,
                    Clicks = c.Clicks,
                    Conversions = c.Conversions,
                    TotalSpent = c.TotalSpent
                }).ToListAsync();

            var wallet = doctorUser != null ? await _context.Wallets
                .Where(w => w.UserId == doctorUser.UserId && w.IsActive)
                .Select(w => new DashboardWalletDto
                {
                    Balance = w.Balance
                })
                .FirstOrDefaultAsync() : null;

            var lastSalary = await _context.DoctorSalaries
                .Where(s => s.DoctorId == doctorId)
                .OrderByDescending(s => s.PeriodEndDate)
                .FirstOrDefaultAsync();

            var recentReviews = await _context.Reviews
                .Where(r => r.Appointment.DoctorId == doctorId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(3)
                .Select(r => new DashboardReviewItemDto
                {
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    PatientName = r.Appointment.Patient.User.FullName
                }).ToListAsync();

            return new DoctorDashboardDto
            {
                Summary = new DashboardSummaryDto
                {
                    TodayAppointments = todayAppointments.Count,
                    TodayRevenue = todayRevenue,
                    MonthRevenue = monthRevenue,
                    TotalRevenue = totalRevenue,
                    AverageRating = avgRating
                },
                Schedule = new DashboardScheduleDto
                {
                    Regular = regularSchedule,
                    Overrides = overrides
                },
                Wallet = wallet,
                Subscription = activeSubscription != null ? new DashboardSubscriptionDto
                {
                    Name = activeSubscription.ServicePackage.Name,
                    Features = activeSubscription.ServicePackage.Features,
                    MonthlyFee = activeSubscription.ServicePackage.MonthlyFee
                } : null,
                Campaigns = activeCampaigns,
                Salary = lastSalary != null ? new DashboardSalaryDto
                {
                    PeriodStartDate = lastSalary.PeriodStartDate,
                    PeriodEndDate = lastSalary.PeriodEndDate,
                    NetSalary = lastSalary.NetSalary,
                    Status = lastSalary.Status
                } : null,
                Reviews = new DashboardReviewDto
                {
                    AverageRating = avgRating,
                    Recent = recentReviews
                }
            };
        }
    }
}
