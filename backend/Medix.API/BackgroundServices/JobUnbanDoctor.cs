
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

                    var delay = nextSunday - now;

                    _logger.LogInformation(
                        "JobUnbanDoctor sẽ chạy vào: {nextRun}. Đợi {hours} giờ {minutes} phút",
                        nextSunday, delay.Hours, delay.Minutes);

                    await CheckAndUnbanDoctors(stoppingToken);

                    await Task.Delay(delay, stoppingToken);


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

                var doctorsToUnban = await context.Doctors
                    .Where(d => d.EndDateBanned < now
                             && d.EndDateBanned > DateTime.MinValue
                             && d.EndDateBanned < DateTime.Now.AddYears(50))
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

                    if (doctor.NextWeekMiss > 0)
                    {
                        var carryOverMiss = 1;
                        doctor.TotalCaseMissPerWeek = carryOverMiss;

                        _logger.LogWarning(
                            "⚠️ Doctor {doctorId} ({naWme}) được MỞ BAN. " +
                            "Áp dụng NextWeekMiss = {nextWeek} (giới hạn {limit}) vào TotalCaseMissPerWeek cho tuần mới",
                            doctor.Id, doctor.User?.FullName ?? "N/A",
                            doctor.NextWeekMiss, carryOverMiss);
                    }

                    doctor.NextWeekMiss = 0;

                    doctor.StartDateBanned = DateTime.MinValue;
                    doctor.EndDateBanned = DateTime.MinValue;
                    doctor.IsAcceptingAppointments = true;
                    doctor.UpdatedAt = DateTime.UtcNow;

                    unbannedCount++;

                    _logger.LogInformation(
                        "Đã MỞ BAN cho Doctor {doctorId} ({name}). " +
                        "EndDateBanned cũ: {oldEnd}, TotalBanned: {total}, TotalCaseMissPerWeek: {miss}",
                        doctor.Id, doctor.User?.FullName ?? "N/A",
                        oldEndDate, doctor.TotalBanned, doctor.TotalCaseMissPerWeek);
                }

                await context.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Hoàn thành mở ban cho {count} doctor", unbannedCount);
            }
        }

        private DateTime GetNextSunday14PM(DateTime now)
        {
            var daysUntilSunday = ((int)DayOfWeek.Sunday - (int)now.DayOfWeek + 7) % 7;

            if (daysUntilSunday == 0 && now.Hour >= 14)
            {
                daysUntilSunday = 7;
            }

            if (daysUntilSunday == 0)
            {
                return now.Date.AddHours(14);
            }

            var nextSunday = now.Date.AddDays(daysUntilSunday).AddHours(14);

            return nextSunday;
        }
    }
}