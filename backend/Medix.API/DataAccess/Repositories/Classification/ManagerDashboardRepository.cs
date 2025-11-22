using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ManagerDashboardRepository : IManagerDashboardRepository
    {
        private readonly MedixContext _context;

        public ManagerDashboardRepository(MedixContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy dữ liệu dashboard cho Manager
        /// </summary>
        /// <returns>ManagerDashboardDto chứa thống kê, danh sách bác sĩ và hoạt động gần đây</returns>
        /// <remarks>
        /// CÁCH XÁC ĐỊNH BÁC SĨ CÓ CA LÀM VIỆC TRONG NGÀY (ActiveDoctors):
        /// 
        /// 1. ĐIỀU KIỆN TIÊN QUYẾT:
        ///    - User.Status = 1 (Active)
        ///    - User.LockoutEnabled = false
        ///    - Doctor.IsVerified = true
        ///    - Doctor.IsAcceptingAppointments = true
        ///    - Không bị ban: !(StartDateBanned <= now <= EndDateBanned)
        /// 
        /// 2. KIỂM TRA CÓ CA LÀM VIỆC TRONG NGÀY (không cần kiểm tra thời gian hiện tại):
        ///    a) Override cho phép làm việc (OverrideType = true + IsAvailable = true)
        ///       → Có ca làm việc trong ngày
        ///    
        ///    b) Lịch thường xuyên (DoctorSchedule) cho ngày hôm nay:
        ///       - Nếu không có override chặn → Có ca làm việc
        ///       - Nếu có override chặn → Kiểm tra xem còn ca nào không bị chặn không
        ///       - Nếu tất cả ca đều bị chặn → Không có ca làm việc
        /// 
        /// 3. TRẠNG THÁI REAL-TIME (cho RecentDoctors):
        ///    - Online: Đang trong giờ làm việc tại thời điểm hiện tại
        ///    - Busy: Đang trong giờ làm việc VÀ có appointment đang diễn ra
        ///    - Offline: Không trong giờ làm việc tại thời điểm hiện tại
        /// </remarks>
        public async Task<ManagerDashboardDto> GetDashboardAsync()
        {
            var today = DateTime.Today;
            var now = DateTime.Now;
            var currentTime = TimeOnly.FromDateTime(now);

            // Tính số bác sĩ đang hoạt động (có lịch làm việc trong ca hiện tại)
            // Điều kiện:
            // 1. User phải active (Status = 1) và không bị lockout
            // 2. Doctor phải verified và đang nhận lịch
            // 3. Không bị ban: StartDateBanned <= now <= EndDateBanned là điều kiện bị ban
            var activeDoctors = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .Include(d => d.DoctorSchedules)
                .Include(d => d.DoctorScheduleOverrides)
                .Where(d => d.User != null && 
                           d.User.Status == 1 && 
                           !d.User.LockoutEnabled &&
                           d.IsAcceptingAppointments &&
                           d.IsVerified &&
                           // Không bị ban: không có StartDateBanned hoặc đã hết hạn ban
                           // Bị ban khi: StartDateBanned <= now <= EndDateBanned
                           // Không bị ban khi: !StartDateBanned.HasValue || StartDateBanned > now || !EndDateBanned.HasValue || EndDateBanned < now
                           (!d.StartDateBanned.HasValue || 
                            d.StartDateBanned.Value > now || 
                            !d.EndDateBanned.HasValue || 
                            d.EndDateBanned.Value < now))
                .ToListAsync();

            var dayOfWeek = (int)today.DayOfWeek;
            var todayDateOnly = DateOnly.FromDateTime(today);

            // Đếm số bác sĩ có ca làm việc trong ngày hôm nay
            // Logic: Bác sĩ có ca làm việc nếu:
            // 1. Có lịch thường xuyên (DoctorSchedule) cho ngày hôm nay VÀ không bị chặn bởi override
            // 2. HOẶC có override cho phép làm việc (OverrideType = true + IsAvailable = true)
            var activeDoctorsCount = 0;
            var recentDoctorsList = new List<ManagerDashboardDoctorDto>();

            // Lấy danh sách các appointment đang diễn ra để kiểm tra trạng thái Busy
            var activeAppointmentDoctorIds = await _context.Appointments
                .Where(a => a.AppointmentStartTime <= now &&
                           a.AppointmentEndTime >= now &&
                           (a.StatusCode == "Confirmed" || a.StatusCode == "InProgress"))
                .Select(a => a.DoctorId)
                .ToListAsync();

            foreach (var doctor in activeDoctors)
            {
                // Lấy TẤT CẢ lịch thường xuyên cho ngày hôm nay (bác sĩ có thể có nhiều ca)
                var regularSchedules = doctor.DoctorSchedules
                    .Where(s => s.DayOfWeek == dayOfWeek && s.IsAvailable)
                    .OrderBy(s => s.StartTime)
                    .ToList();

                // Lấy tất cả override cho ngày hôm nay (có thể có nhiều override)
                var todayOverrides = doctor.DoctorScheduleOverrides
                    .Where(o => o.OverrideDate == todayDateOnly)
                    .OrderBy(o => o.StartTime)
                    .ToList();

                // ========== LOGIC ĐẾM BÁC SĨ CÓ CA LÀM VIỆC TRONG NGÀY ==========
                // Không cần kiểm tra thời gian hiện tại, chỉ cần kiểm tra xem có ca nào trong ngày không
                bool hasWorkingScheduleToday = false;

                // Kiểm tra override cho phép làm việc (OverrideType = true + IsAvailable = true)
                var hasWorkingOverride = todayOverrides
                    .Any(o => o.OverrideType && o.IsAvailable);

                if (hasWorkingOverride)
                {
                    // Có override cho phép làm việc trong ngày
                    hasWorkingScheduleToday = true;
                }
                else if (regularSchedules.Any())
                {
                    // Có lịch thường xuyên, kiểm tra xem có bị chặn hoàn toàn bởi override không
                    // Nếu tất cả lịch thường xuyên đều bị chặn bởi override, thì không có ca làm việc
                    // Ngược lại, nếu còn ít nhất 1 ca không bị chặn, thì có ca làm việc
                    var blockingOverrides = todayOverrides
                        .Where(o => !o.OverrideType)
                        .ToList();

                    if (!blockingOverrides.Any())
                    {
                        // Không có override chặn, có lịch thường xuyên = có ca làm việc
                        hasWorkingScheduleToday = true;
                    }
                    else
                    {
                        // Có override chặn, kiểm tra xem còn ca nào không bị chặn không
                        foreach (var schedule in regularSchedules)
                        {
                            var isBlocked = blockingOverrides
                                .Any(block => schedule.StartTime < block.EndTime && 
                                             schedule.EndTime > block.StartTime);

                            if (!isBlocked)
                            {
                                // Có ít nhất 1 ca không bị chặn
                                hasWorkingScheduleToday = true;
                                break;
                            }
                        }
                    }
                }

                // Đếm bác sĩ có ca làm việc trong ngày
                if (hasWorkingScheduleToday)
                {
                    activeDoctorsCount++;
                }

                // ========== LOGIC XÁC ĐỊNH TRẠNG THÁI REAL-TIME (cho RecentDoctors) ==========
                // Xác định trạng thái tại thời điểm hiện tại: Online/Busy/Offline
                bool isCurrentlyWorking = false;
                string status = "Offline";
                string statusDisplayName = "Nghỉ";

                // Bước 1: Kiểm tra override cho phép làm việc tại thời điểm hiện tại
                var workingOverride = todayOverrides
                    .FirstOrDefault(o => o.OverrideType && 
                                       o.IsAvailable && 
                                       currentTime >= o.StartTime && 
                                       currentTime <= o.EndTime);

                if (workingOverride != null)
                {
                    isCurrentlyWorking = true;
                    status = "Online";
                    statusDisplayName = "Đang hoạt động";
                }
                else
                {
                    // Bước 2: Kiểm tra override chặn tại thời điểm hiện tại
                    var blockingOverride = todayOverrides
                        .Any(o => !o.OverrideType && 
                                currentTime >= o.StartTime && 
                                currentTime <= o.EndTime);

                    if (!blockingOverride)
                    {
                        // Không bị chặn, kiểm tra lịch thường xuyên tại thời điểm hiện tại
                        var activeSchedule = regularSchedules
                            .FirstOrDefault(s => currentTime >= s.StartTime && 
                                               currentTime <= s.EndTime);

                        if (activeSchedule != null)
                        {
                            isCurrentlyWorking = true;
                            status = "Online";
                            statusDisplayName = "Đang hoạt động";
                        }
                    }
                }

                // Kiểm tra xem bác sĩ có đang trong cuộc hẹn không (Busy)
                if (activeAppointmentDoctorIds.Contains(doctor.Id) && isCurrentlyWorking)
                {
                    status = "Busy";
                    statusDisplayName = "Bận";
                }

                // Thêm vào danh sách bác sĩ gần đây (lấy tối đa 10 bác sĩ)
                if (recentDoctorsList.Count < 10)
                {
                    recentDoctorsList.Add(new ManagerDashboardDoctorDto
                    {
                        DoctorId = doctor.Id,
                        DoctorName = doctor.User?.FullName ?? string.Empty,
                        SpecialtyName = doctor.Specialization?.Name ?? string.Empty,
                        Status = status,
                        StatusDisplayName = statusDisplayName,
                        IsAcceptingAppointments = doctor.IsAcceptingAppointments
                    });
                }
            }

            // Nếu chưa đủ 10 bác sĩ, lấy thêm từ danh sách bác sĩ gần đây nhất (ưu tiên bác sĩ đang hoạt động)
            if (recentDoctorsList.Count < 10)
            {
                var existingDoctorIds = recentDoctorsList.Select(rd => rd.DoctorId).ToList();
                
                var additionalDoctors = await _context.Doctors
                    .Include(d => d.User)
                    .Include(d => d.Specialization)
                    .Where(d => d.User != null && 
                               d.User.Status == 1 && 
                               !d.User.LockoutEnabled &&
                               d.IsVerified &&
                               !existingDoctorIds.Contains(d.Id) &&
                               // Không bị ban (giống logic trên)
                               (!d.StartDateBanned.HasValue || 
                                d.StartDateBanned.Value > now || 
                                !d.EndDateBanned.HasValue || 
                                d.EndDateBanned.Value < now))
                    .OrderByDescending(d => d.IsAcceptingAppointments) // Ưu tiên bác sĩ đang nhận lịch
                    .ThenByDescending(d => d.CreatedAt) // Sau đó sắp xếp theo ngày tạo
                    .Take(10 - recentDoctorsList.Count)
                    .Select(d => new ManagerDashboardDoctorDto
                    {
                        DoctorId = d.Id,
                        DoctorName = d.User!.FullName,
                        SpecialtyName = d.Specialization!.Name,
                        Status = "Offline",
                        StatusDisplayName = "Nghỉ",
                        IsAcceptingAppointments = d.IsAcceptingAppointments
                    })
                    .ToListAsync();

                recentDoctorsList.AddRange(additionalDoctors);
            }

            // Lịch hẹn hôm nay
            var todayAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == today)
                .CountAsync();

            var todayConfirmedAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == today && 
                           (a.StatusCode == "Confirmed" || a.StatusCode == "InProgress"))
                .CountAsync();

            // Đánh giá trung bình
            var averageRating = await _context.Reviews
                .AverageAsync(r => (double?)r.Rating) ?? 0;

            var totalReviews = await _context.Reviews.CountAsync();

            // Hoạt động gần đây
            var recentActivities = new List<ManagerDashboardRecentActivityDto>();

            // Lịch hẹn gần đây
            var recentAppointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Where(a => a.Doctor != null && a.Doctor.User != null && 
                           a.Patient != null && a.Patient.User != null)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new ManagerDashboardRecentActivityDto
                {
                    ActivityType = "APPOINTMENT",
                    Title = "Lịch hẹn mới",
                    Description = $"Bệnh nhân {a.Patient!.User!.FullName} đặt lịch với Bác sĩ {a.Doctor!.User!.FullName}",
                    CreatedAt = a.CreatedAt,
                    UserName = a.Patient!.User!.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentAppointments);

            // Bác sĩ mới đăng ký
            var recentDoctors = await _context.Doctors
                .Include(d => d.User)
                .Where(d => d.User != null)
                .OrderByDescending(d => d.CreatedAt)
                .Take(3)
                .Select(d => new ManagerDashboardRecentActivityDto
                {
                    ActivityType = "DOCTOR_REGISTRATION",
                    Title = "Bác sĩ mới đăng ký",
                    Description = $"{d.User!.FullName} đã đăng ký tài khoản bác sĩ",
                    CreatedAt = d.CreatedAt,
                    UserName = d.User!.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentDoctors);

            // Bài viết mới
            var recentArticles = await _context.HealthArticles
                .Include(a => a.Author)
                .Where(a => a.StatusCode == "Published" && a.Author != null)
                .OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
                .Take(2)
                .Select(a => new ManagerDashboardRecentActivityDto
                {
                    ActivityType = "ARTICLE_PUBLISHED",
                    Title = "Bài viết mới",
                    Description = $"\"{a.Title}\" đã được xuất bản",
                    CreatedAt = a.PublishedAt ?? a.CreatedAt,
                    UserName = a.Author!.FullName
                })
                .ToListAsync();

            recentActivities.AddRange(recentArticles);

            var allRecentActivities = recentActivities
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToList();

            // Feedback gần đây từ bệnh nhân cho bác sĩ
            var recentFeedbacks = await _context.Reviews
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.Specialization)
                .Include(r => r.Appointment)
                    .ThenInclude(a => a.Patient)
                        .ThenInclude(p => p.User)
                .Where(r => r.Appointment != null && 
                           r.Appointment.Doctor != null && 
                           r.Appointment.Doctor.User != null &&
                           r.Appointment.Doctor.Specialization != null &&
                           r.Appointment.Patient != null && 
                           r.Appointment.Patient.User != null)
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new ManagerDashboardRecentFeedbackDto
                {
                    ReviewId = r.Id,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    PatientName = r.Appointment!.Patient!.User!.FullName,
                    DoctorName = r.Appointment!.Doctor!.User!.FullName,
                    DoctorId = r.Appointment!.Doctor!.Id,
                    SpecialtyName = r.Appointment!.Doctor!.Specialization!.Name,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return new ManagerDashboardDto
            {
                Summary = new ManagerDashboardSummaryDto
                {
                    ActiveDoctors = activeDoctorsCount,
                    TodayAppointments = todayAppointments,
                    TodayConfirmedAppointments = todayConfirmedAppointments,
                    AverageRating = Math.Round(averageRating, 1),
                    TotalReviews = totalReviews
                },
                RecentDoctors = recentDoctorsList,
                RecentActivities = allRecentActivities,
                RecentFeedbacks = recentFeedbacks
            };
        }
    }
}

