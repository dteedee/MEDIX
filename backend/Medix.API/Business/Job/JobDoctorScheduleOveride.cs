using Medix.API.DataAccess.Interfaces.Classification;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Business.Job
{
    public class JobDoctorScheduleOveride : Microsoft.Extensions.Hosting.BackgroundService
    {
        private readonly ILogger<JobDoctorScheduleOveride> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _runInterval = TimeSpan.FromSeconds(30); // Chạy mỗi 1 giờ

        public JobDoctorScheduleOveride(
            ILogger<JobDoctorScheduleOveride> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("=== JobDoctorScheduleOverride started at {Time} ===", DateTimeOffset.Now);

            // Chạy ngay lập tức khi service khởi động
            await ProcessExpiredOverrides(stoppingToken);

            // Sau đó chạy theo interval
            using var timer = new PeriodicTimer(_runInterval);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessExpiredOverrides(stoppingToken);
            }
        }

        private async Task ProcessExpiredOverrides(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IDoctorScheduleOverrideRepository>();

                // Lấy ngày hiện tại (chỉ phần date, không bao gồm time)
                var today = DateOnly.FromDateTime(DateTime.UtcNow);

                _logger.LogInformation("=== Checking for expired schedule overrides on {Date} ===", today);

                // Lấy tất cả các override đã qua ngày và vẫn đang IsAvailable = true
                var expiredOverrides = await scope.ServiceProvider
                    .GetRequiredService<DataAccess.MedixContext>()
                    .DoctorScheduleOverrides
                    .Where(o => o.OverrideDate < today && o.IsAvailable)
                    .ToListAsync(stoppingToken);

                if (expiredOverrides.Count == 0)
                {
                    _logger.LogInformation("=== No expired schedule overrides found ===");
                    return;
                }

                _logger.LogInformation("=== Found {Count} expired schedule overrides ===", expiredOverrides.Count);

                // Set IsAvailable = false cho tất cả các override đã hết hạn
                foreach (var expiredOverride in expiredOverrides)
                {
                    expiredOverride.IsAvailable = false;
                    expiredOverride.UpdatedAt = DateTime.UtcNow;

                    _logger.LogInformation(
                        "=== Set IsAvailable=false for DoctorScheduleOverride [ID: {Id}] [DoctorId: {DoctorId}] [OverrideDate: {OverrideDate}] ===",
                        expiredOverride.Id,
                        expiredOverride.DoctorId,
                        expiredOverride.OverrideDate);
                }

                // Lưu thay đổi
                await repository.SaveChangesAsync();

                _logger.LogInformation(
                    "=== Successfully updated {Count} expired schedule overrides at {Time} ===",
                    expiredOverrides.Count,
                    DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "=== Error occurred while processing expired schedule overrides ===");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("=== JobDoctorScheduleOverride is stopping at {Time} ===", DateTimeOffset.Now);
            await base.StopAsync(stoppingToken);
        }
    }
}