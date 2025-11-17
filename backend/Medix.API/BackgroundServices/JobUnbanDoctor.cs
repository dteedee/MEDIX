
using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.BackgroundServices
{
    public class JobUnbanDoctor : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobUnbanDoctor> _logger;

        public JobUnbanDoctor(
            IServiceProvider serviceProvider,
            ILogger<JobUnbanDoctor> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("JobUnbanDoctor Background Service đang khởi động...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextSunday = GetNextSunday14PM(now);

                    // Tính thời gian chờ đến Chủ nhật 14:00 tiếp theo
                    var delay = nextSunday - now;

                    _logger.LogInformation(
                        "JobUnbanDoctor sẽ chạy vào: {nextRun}. Đợi {hours} giờ {minutes} phút",
                        nextSunday, delay.Hours, delay.Minutes);

                    // Đợi đến Chủ nhật 14:00
                    await Task.Delay(delay, stoppingToken);

                    // Thực thi logic mở ban cho doctor
                    await CheckAndUnbanDoctors(stoppingToken);

                    _logger.LogInformation("JobUnbanDoctor đã hoàn thành. Sẽ chạy lại vào Chủ nhật 14:00 tuần sau.");
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("JobUnbanDoctor đang dừng...");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong JobUnbanDoctor: {message}", ex.Message);
                    // Đợi 1 giờ trước khi retry để tránh loop lỗi liên tục
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("JobUnbanDoctor đã dừng.");
        }

        private async Task CheckAndUnbanDoctors(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MedixContext>();

                var now = DateTime.Now;

                // Lấy doctor có EndDateBanned đã kết thúc (< now) và không phải ban vĩnh viễn
                var doctorsToUnban = await context.Doctors
                    .Where(d => d.EndDateBanned < now
                             && d.EndDateBanned > DateTime.MinValue  // Đã từng bị ban
                             && d.EndDateBanned < DateTime.Now.AddYears(50)) // Không phải ban vĩnh viễn
                    .ToListAsync(stoppingToken);

                if (!doctorsToUnban.Any())
                {
                    _logger.LogInformation("Không có doctor nào cần mở ban.");
                    return;
                }

                _logger.LogInformation("Tìm thấy {count} doctor cần mở ban...", doctorsToUnban.Count);

                int unbannedCount = 0;

                foreach (var doctor in doctorsToUnban)
                {
                    var oldEndDate = doctor.EndDateBanned;

                    // Cộng NextWeekMiss vào TotalCaseMissPerWeek KHI MỞ BAN
                    if (doctor.NextWeekMiss > 0)
                    {
                        var carryOverMiss = 1; // Giới hạn tối đa 2
                        doctor.TotalCaseMissPerWeek = carryOverMiss;

                        _logger.LogWarning(
                            "⚠️ Doctor {doctorId} ({naWme}) được MỞ BAN. " +
                            "Áp dụng NextWeekMiss = {nextWeek} (giới hạn {limit}) vào TotalCaseMissPerWeek cho tuần mới",
                            doctor.Id, doctor.User?.FullName ?? "N/A",
                            doctor.NextWeekMiss, carryOverMiss);
                    }

                    // Reset NextWeekMiss về 0 sau khi áp dụng
                    doctor.NextWeekMiss = 0;

                    // Reset trạng thái ban
                    doctor.StartDateBanned = DateTime.MinValue;
                    doctor.EndDateBanned = DateTime.MinValue;
                    doctor.IsAcceptingAppointments = true;
                    doctor.UpdatedAt = DateTime.UtcNow;

                    unbannedCount++;

                    _logger.LogInformation(
                        "✅ Đã MỞ BAN cho Doctor {doctorId} ({name}). " +
                        "EndDateBanned cũ: {oldEnd}, TotalBanned: {total}, TotalCaseMissPerWeek: {miss}",
                        doctor.Id, doctor.User?.FullName ?? "N/A",
                        oldEndDate, doctor.TotalBanned, doctor.TotalCaseMissPerWeek);
                }

                await context.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Hoàn thành mở ban cho {count} doctor", unbannedCount);
            }
        }

        /// <summary>
        /// Tính thời điểm Chủ nhật 14:00 tiếp theo
        /// </summary>
        private DateTime GetNextSunday14PM(DateTime now)
        {
            // Chủ nhật = DayOfWeek.Sunday (0)
            var daysUntilSunday = ((int)DayOfWeek.Sunday - (int)now.DayOfWeek + 7) % 7;

            // Nếu hôm nay là Chủ nhật nhưng đã qua 14:00, chuyển sang Chủ nhật tuần sau
            if (daysUntilSunday == 0 && now.Hour >= 14)
            {
                daysUntilSunday = 7;
            }

            // Nếu hôm nay là Chủ nhật và chưa qua 14:00, lấy 14:00 hôm nay
            if (daysUntilSunday == 0)
            {
                return now.Date.AddHours(14);
            }

            // Nếu không phải Chủ nhật, tính đến Chủ nhật 14:00 tiếp theo
            var nextSunday = now.Date.AddDays(daysUntilSunday).AddHours(14);

            return nextSunday;
        }
    }
}