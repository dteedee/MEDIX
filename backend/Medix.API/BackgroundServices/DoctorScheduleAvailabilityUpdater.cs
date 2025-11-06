using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Medix.API.BackgroundServices
{
    public class DoctorScheduleAvailabilityUpdater : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DoctorScheduleAvailabilityUpdater> _logger;

        public DoctorScheduleAvailabilityUpdater(IServiceProvider serviceProvider, ILogger<DoctorScheduleAvailabilityUpdater> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DoctorScheduleAvailabilityUpdater started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;
                var nextRun = DateTime.Today.AddDays(1).AddHours(1); // 👉 1h sáng ngày mai
                var delay = nextRun - now;

                _logger.LogInformation("Next update scheduled at {NextRun}", nextRun);

                // chạy job ngay nếu khởi động sau 1h sáng
                if (delay.TotalMilliseconds < 0)
                {
                    nextRun = DateTime.Today.AddDays(1).AddHours(1);
                    delay = nextRun - now;
                }

                await Task.Delay(delay, stoppingToken);

                try
                {
                    await UpdateIsAvailableAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while updating doctor schedule availability.");
                }
            }
        }

        private async Task UpdateIsAvailableAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MedixContext>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var outdated = await db.DoctorScheduleOverrides
                .Where(x => x.OverrideDate < today && x.IsAvailable == true)
                .ToListAsync();

            if (outdated.Any())
            {
                foreach (var item in outdated)
                {
                    item.IsAvailable = false;
                    item.UpdatedAt = DateTime.UtcNow;
                }

                await db.SaveChangesAsync();
                _logger.LogInformation("✅ Updated {Count} outdated schedule(s) at {Time}", outdated.Count, DateTime.UtcNow);
            }
            else
            {
                _logger.LogInformation("ℹ️ No outdated schedule found at {Time}", DateTime.UtcNow);
            }
        }
    }
}