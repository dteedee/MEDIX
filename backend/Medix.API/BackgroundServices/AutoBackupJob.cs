using Medix.API.Business.Interfaces.Classification;
using Microsoft.Extensions.Logging;

namespace Medix.API.BackgroundServices
{
    public class AutoBackupJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoBackupJob> _logger;

        public AutoBackupJob(
            IServiceProvider serviceProvider,
            ILogger<AutoBackupJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoBackupJob Background Service đang khởi động...");
            var runImmediately = true;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var configService = scope.ServiceProvider.GetRequiredService<ISystemConfigurationService>();
                    var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                    var autoBackupEnabled = await configService.GetBoolValueAsync("AUTO_BACKUP_ENABLED");
                    if (autoBackupEnabled == true)
                    {
                        var frequency = await configService.GetValueAsync<string>("AUTO_BACKUP_FREQUENCY") ?? "daily";
                        var backupTime = await configService.GetValueAsync<string>("AUTO_BACKUP_TIME") ?? "02:00";
                        var retentionDays = await configService.GetIntValueAsync("BACKUP_RETENTION_DAYS") ?? 30;

                        if (runImmediately)
                        {
                            _logger.LogInformation("Thực hiện backup ngay khi khởi động ứng dụng trước khi vào lịch.");
                        }
                        else
                        {
                            var nextRun = CalculateNextRunTime(frequency, backupTime);
                            var delay = nextRun - DateTime.UtcNow;

                            if (delay.TotalMilliseconds < 0)
                            {
                                delay = TimeSpan.Zero;
                            }

                            _logger.LogInformation(
                                "AutoBackupJob sẽ chạy vào: {nextRun} (UTC). Đợi {hours} giờ {minutes} phút",
                                nextRun, delay.Hours, delay.Minutes);

                            if (delay.TotalMilliseconds > 0)
                            {
                                await Task.Delay(delay, stoppingToken);
                            }
                        }

                        await RunBackupPipelineAsync(backupService, retentionDays);
                        runImmediately = false;
                    }
                    else
                    {
                        _logger.LogInformation("Auto backup đang bị tắt. Sẽ kiểm tra lại sau 1 giờ.");
                        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("AutoBackupJob đã bị hủy");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong AutoBackupJob");
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private DateTime CalculateNextRunTime(string frequency, string backupTime)
        {
            var timeParts = backupTime.Split(':');
            if (timeParts.Length != 2 ||
                !int.TryParse(timeParts[0], out int hour) ||
                !int.TryParse(timeParts[1], out int minute))
            {
                hour = 2;
                minute = 0;
            }

            var now = DateTime.UtcNow;
            var todayBackupTime = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0);

            switch (frequency.ToLower())
            {
                case "daily":
                    if (now < todayBackupTime)
                    {
                        return todayBackupTime;
                    }
                    return todayBackupTime.AddDays(1);

                case "weekly":
                    var daysUntilMonday = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;
                    if (daysUntilMonday == 0 && now < todayBackupTime)
                    {
                        return todayBackupTime;
                    }
                    if (daysUntilMonday == 0)
                    {
                        daysUntilMonday = 7;
                    }
                    return todayBackupTime.AddDays(daysUntilMonday);

                case "monthly":
                    var firstOfMonth = new DateTime(now.Year, now.Month, 1, hour, minute, 0);
                    if (now < firstOfMonth)
                    {
                        return firstOfMonth;
                    }
                    return firstOfMonth.AddMonths(1);

                default:
                    if (now < todayBackupTime)
                    {
                        return todayBackupTime;
                    }
                    return todayBackupTime.AddDays(1);
            }
        }

        private async Task RunBackupPipelineAsync(
            IBackupService backupService,
            int retentionDays)
        {
            try
            {
                _logger.LogInformation("Bắt đầu tạo backup toàn bộ database (.bak)...");
                var backupLabel = $"auto-backup-{DateTime.UtcNow:yyyyMMdd_HHmmss}";
                var backup = await backupService.CreateBackupAsync(backupLabel, "system");
                _logger.LogInformation("Đã tạo backup database tại: {Path}", backup.FilePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Không thể tạo backup database");
                return;
            }

            try
            {
                var deletedCount = await backupService.CleanupOldBackupsAsync(retentionDays);
                if (deletedCount > 0)
                {
                    _logger.LogInformation("Đã xóa {DeletedCount} bản backup cũ", deletedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi dọn dẹp backup cũ");
            }
        }
    }
}

