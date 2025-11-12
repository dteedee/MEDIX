using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Medix.API.BackgroundServices
{
    public class JobDoctorScheduleOveride : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobDoctorScheduleOveride> _logger;

        public JobDoctorScheduleOveride(IServiceProvider serviceProvider, ILogger<JobDoctorScheduleOveride> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("=== JobDoctorScheduleOveride started at {Time} ===", DateTimeOffset.Now);

            try
            {
                // 🔹 Chạy ngay khi API khởi động
                await UpdateExpiredOverridesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error while running initial update on startup.");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                // 🔹 Tính thời điểm 1h sáng ngày kế tiếp (theo giờ Việt Nam)
                var vietnamTime = DateTime.UtcNow.AddHours(7);
                var nextRun = vietnamTime.Date.AddDays(1).AddHours(1);
                var delay = nextRun - vietnamTime;

                _logger.LogInformation("🕐 Next update scheduled at {NextRun} (Vietnam time)", nextRun);

                // Nếu server khởi động sau 1h sáng, thì đợi tới 1h sáng ngày kế
                if (delay.TotalMilliseconds < 0)
                {
                    nextRun = vietnamTime.Date.AddDays(1).AddHours(1);
                    delay = nextRun - vietnamTime;
                }

                try
                {
                    await Task.Delay(delay, stoppingToken);
                    await UpdateExpiredOverridesAsync();
                }
                catch (TaskCanceledException)
                {
                    // service bị dừng
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error while updating expired overrides.");
                }
            }
        }

        private async Task UpdateExpiredOverridesAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MedixContext>();

            var vietnamTime = DateTime.UtcNow.AddHours(7);
            var today = DateOnly.FromDateTime(vietnamTime);

            var expiredOverrides = await db.DoctorScheduleOverrides
                .Where(o => o.OverrideDate < today && o.IsAvailable)
                .ToListAsync();

            if (expiredOverrides.Any())
            {
                foreach (var item in expiredOverrides)
                {
                    item.IsAvailable = false;
                    item.UpdatedAt = DateTime.UtcNow;
                }

                await db.SaveChangesAsync();

                _logger.LogInformation(
                    "✅ Updated {Count} expired overrides at {Time}",
                    expiredOverrides.Count,
                    vietnamTime);
            }
            else
            {
                _logger.LogInformation("ℹ️ No expired overrides found at {Time}", vietnamTime);
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("=== JobDoctorScheduleOveride is stopping at {Time} ===", DateTimeOffset.Now);
            await base.StopAsync(stoppingToken);
        }
    }
}
