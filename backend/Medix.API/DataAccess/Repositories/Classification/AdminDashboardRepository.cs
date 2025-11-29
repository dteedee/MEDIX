using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class AdminDashboardRepository : IAdminDashboardRepository
    {
        private readonly MedixContext _context;

        public AdminDashboardRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            var today = DateTime.Today;
            var yesterday = today.AddDays(-1);
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var lastMonthStart = monthStart.AddMonths(-1);
            var lastMonthEnd = monthStart.AddDays(-1);
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var lastWeekStart = weekStart.AddDays(-7);
            var lastWeekEnd = weekStart.AddDays(-1);

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.Where(u => u.Status == 1 && !u.LockoutEnabled).CountAsync();
            
            var totalDoctors = await _context.Doctors.CountAsync();
            var activeDoctors = await _context.Doctors
                .Where(d => d.User != null && d.User.Status == 1 && !d.User.LockoutEnabled)
                .CountAsync();
            
            var totalPatients = await _context.Patients.CountAsync();

            var todayAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == today)
                .CountAsync();
            
            var totalAppointments = await _context.Appointments.CountAsync();

            var totalHealthArticles = await _context.HealthArticles.CountAsync();

            var totalRevenue = await _context.Appointments
                .Where(a => a.PaymentStatusCode == "Paid")
                .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;

            var todayRevenue = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == today && a.PaymentStatusCode == "Paid")
                .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;

            var monthRevenue = await _context.Appointments
                .Where(a => a.AppointmentStartTime >= monthStart && a.PaymentStatusCode == "Paid")
                .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;

            var averageRating = await _context.Reviews
                .AverageAsync(r => (double?)r.Rating) ?? 0;

            var lastMonthUsers = await _context.Users
                .Where(u => u.CreatedAt >= lastMonthStart && u.CreatedAt < monthStart)
                .CountAsync();
            var currentMonthUsers = await _context.Users
                .Where(u => u.CreatedAt >= monthStart)
                .CountAsync();
            var usersGrowthPercentage = lastMonthUsers > 0 
                ? ((double)(currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
                : (currentMonthUsers > 0 ? 100 : 0);

            var lastWeekDoctors = await _context.Doctors
                .Where(d => d.User != null && d.User.CreatedAt >= lastWeekStart && d.User.CreatedAt <= lastWeekEnd)
                .CountAsync();
            var currentWeekDoctors = await _context.Doctors
                .Where(d => d.User != null && d.User.CreatedAt >= weekStart)
                .CountAsync();
            var doctorsGrowthPercentage = lastWeekDoctors > 0 
                ? ((double)(currentWeekDoctors - lastWeekDoctors) / lastWeekDoctors) * 100 
                : (currentWeekDoctors > 0 ? 100 : 0);

            var yesterdayAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == yesterday)
                .CountAsync();
            var todayAppointmentsGrowthPercentage = yesterdayAppointments > 0 
                ? ((double)(todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100 
                : (todayAppointments > 0 ? 100 : 0);

            var lastMonthArticles = await _context.HealthArticles
                .Where(a => a.CreatedAt >= lastMonthStart && a.CreatedAt < monthStart)
                .CountAsync();
            var currentMonthArticles = await _context.HealthArticles
                .Where(a => a.CreatedAt >= monthStart)
                .CountAsync();
            var articlesGrowthPercentage = lastMonthArticles > 0 
                ? ((double)(currentMonthArticles - lastMonthArticles) / lastMonthArticles) * 100 
                : (currentMonthArticles > 0 ? 100 : 0);

            var lastMonthRevenue = await _context.Appointments
                .Where(a => a.AppointmentStartTime >= lastMonthStart && a.AppointmentStartTime < monthStart && a.PaymentStatusCode == "Paid")
                .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;
            var revenueGrowthPercentage = lastMonthRevenue > 0 
                ? (double)((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
                : (monthRevenue > 0 ? 100 : 0);

            var lastMonthAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime >= lastMonthStart && a.AppointmentStartTime < monthStart)
                .CountAsync();
            var currentMonthAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime >= monthStart)
                .CountAsync();
            var appointmentsGrowthPercentage = lastMonthAppointments > 0 
                ? ((double)(currentMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100 
                : (currentMonthAppointments > 0 ? 100 : 0);

            var userGrowth = new List<AdminDashboardUserGrowthDto>();
            for (int i = 29; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var usersOnDate = await _context.Users
                    .Where(u => u.CreatedAt.Date <= date)
                    .CountAsync();
                
                var doctorsOnDate = await _context.Doctors
                    .Where(d => d.User != null && d.User.CreatedAt.Date <= date)
                    .CountAsync();
                
                var patientsOnDate = await _context.Patients
                    .Where(p => p.User != null && p.User.CreatedAt.Date <= date)
                    .CountAsync();

                userGrowth.Add(new AdminDashboardUserGrowthDto
                {
                    Period = date.ToString("MM/dd"),
                    Users = usersOnDate,
                    Doctors = doctorsOnDate,
                    Patients = patientsOnDate
                });
            }

            var appointmentTrends = new List<AdminDashboardAppointmentTrendDto>();
            for (int i = 11; i >= 0; i--)
            {
                var month = today.AddMonths(-i);
                var monthStartDate = new DateTime(month.Year, month.Month, 1);
                var monthEndDate = monthStartDate.AddMonths(1).AddDays(-1);

                var appointmentsInMonth = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate)
                    .CountAsync();

                var completedAppointments = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate 
                        && a.StatusCode == "Completed")
                    .CountAsync();

                var cancelledAppointments = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate 
                        && a.StatusCode == "Cancelled")
                    .CountAsync();

                appointmentTrends.Add(new AdminDashboardAppointmentTrendDto
                {
                    Period = monthStartDate.ToString("MM/yyyy"),
                    Appointments = appointmentsInMonth,
                    CompletedAppointments = completedAppointments,
                    CancelledAppointments = cancelledAppointments
                });
            }

            var revenueTrends = new List<AdminDashboardRevenueTrendDto>();
            for (int i = 11; i >= 0; i--)
            {
                var month = today.AddMonths(-i);
                var monthStartDate = new DateTime(month.Year, month.Month, 1);
                var monthEndDate = monthStartDate.AddMonths(1).AddDays(-1);

                var revenueInMonth = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate 
                        && a.PaymentStatusCode == "Paid")
                    .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;

                var consultationFeeInMonth = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate 
                        && a.PaymentStatusCode == "Paid")
                    .SumAsync(a => (decimal?)a.ConsultationFee) ?? 0;

                var platformFeeInMonth = await _context.Appointments
                    .Where(a => a.AppointmentStartTime >= monthStartDate && a.AppointmentStartTime <= monthEndDate 
                        && a.PaymentStatusCode == "Paid")
                    .SumAsync(a => (decimal?)a.PlatformFee) ?? 0;

                revenueTrends.Add(new AdminDashboardRevenueTrendDto
                {
                    Period = monthStartDate.ToString("MM/yyyy"),
                    Revenue = revenueInMonth,
                    ConsultationFee = consultationFeeInMonth,
                    PlatformFee = platformFeeInMonth
                });
            }

            var recentActivities = new List<AdminDashboardRecentActivityDto>();

            var recentUsers = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new AdminDashboardRecentActivityDto
                {
                    ActivityType = "USER_REGISTRATION",
                    Title = "Người dùng mới đăng ký",
                    Description = $"{u.FullName} đã đăng ký tài khoản",
                    CreatedAt = u.CreatedAt,
                    UserName = u.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentUsers);

            var recentAppointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new AdminDashboardRecentActivityDto
                {
                    ActivityType = "APPOINTMENT_CREATED",
                    Title = "Lịch hẹn mới",
                    Description = $"Bệnh nhân {a.Patient.User.FullName} đặt lịch với Bác sĩ {a.Doctor.User.FullName}",
                    CreatedAt = a.CreatedAt,
                    UserName = a.Patient.User.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentAppointments);

            var recentArticles = await _context.HealthArticles
                .Include(a => a.Author)
                .Where(a => a.StatusCode == "Published")
                .OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
                .Take(5)
                .Select(a => new AdminDashboardRecentActivityDto
                {
                    ActivityType = "ARTICLE_PUBLISHED",
                    Title = "Bài viết mới",
                    Description = $"\"{a.Title}\" đã được xuất bản",
                    CreatedAt = a.PublishedAt ?? a.CreatedAt,
                    UserName = a.Author.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentArticles);

            var allRecentActivities = recentActivities
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToList();

            var topSpecialties = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .GroupBy(d => new { d.SpecializationId, d.Specialization.Name })
                .Select(g => new
                {
                    SpecialtyName = g.Key.Name,
                    DoctorIds = g.Select(d => d.Id).ToList(),
                    DoctorCount = g.Count()
                })
                .ToListAsync();

            var topSpecialtiesResult = new List<AdminDashboardTopSpecialtyDto>();
            
            foreach (var specialty in topSpecialties.OrderByDescending(x => x.DoctorCount).Take(10))
            {
                var appointmentCount = await _context.Appointments
                    .Where(a => specialty.DoctorIds.Contains(a.DoctorId))
                    .CountAsync();

                var specialtyRevenue = await _context.Appointments
                    .Where(a => specialty.DoctorIds.Contains(a.DoctorId) && a.PaymentStatusCode == "Paid")
                    .SumAsync(a => (decimal?)a.TotalAmount) ?? 0;

                topSpecialtiesResult.Add(new AdminDashboardTopSpecialtyDto
                {
                    SpecialtyName = specialty.SpecialtyName,
                    DoctorCount = specialty.DoctorCount,
                    AppointmentCount = appointmentCount,
                    TotalRevenue = specialtyRevenue
                });
            }

            return new AdminDashboardDto
            {
                Summary = new AdminDashboardSummaryDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    TotalDoctors = totalDoctors,
                    ActiveDoctors = activeDoctors,
                    TotalPatients = totalPatients,
                    TodayAppointments = todayAppointments,
                    TotalAppointments = totalAppointments,
                    TotalHealthArticles = totalHealthArticles,
                    TotalRevenue = totalRevenue,
                    TodayRevenue = todayRevenue,
                    MonthRevenue = monthRevenue,
                    AverageRating = averageRating
                },
                Growth = new AdminDashboardGrowthDto
                {
                    UsersGrowthPercentage = Math.Round(usersGrowthPercentage, 1),
                    DoctorsGrowthPercentage = Math.Round(doctorsGrowthPercentage, 1),
                    AppointmentsGrowthPercentage = Math.Round(appointmentsGrowthPercentage, 1),
                    ArticlesGrowthPercentage = Math.Round(articlesGrowthPercentage, 1),
                    RevenueGrowthPercentage = Math.Round(revenueGrowthPercentage, 1),
                    TodayAppointmentsGrowthPercentage = Math.Round(todayAppointmentsGrowthPercentage, 1)
                },
                UserGrowth = userGrowth,
                AppointmentTrends = appointmentTrends,
                RevenueTrends = revenueTrends,
                RecentActivities = allRecentActivities,
                TopSpecialties = topSpecialtiesResult
            };
        }
    }
}

