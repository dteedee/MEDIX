using Medix.API.Business.Interfaces.Classification;
using Microsoft.Extensions.Logging;

namespace Medix.API.BackgroundServices
{
    public class AutoBackupJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoBackupJob> _logger;
        private static readonly object _lockObject = new object();
        private static DateTime _lastBackupTime = DateTime.MinValue;

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
                        var timezoneName = await configService.GetValueAsync<string>("BACKUP_TIMEZONE") ?? "SE Asia Standard Time";

                        TimeSpan delayBeforeRun = TimeSpan.Zero;

                        if (runImmediately)
                        {
                            _logger.LogInformation("Thực hiện backup ngay khi khởi động ứng dụng.");
                            runImmediately = false;
                        }
                        else
                        {
                            // Tính toán thời gian chạy tiếp theo
                            var nextRun = CalculateNextRunTime(frequency, backupTime, timezoneName);
                            delayBeforeRun = nextRun - DateTime.UtcNow;

                            _logger.LogInformation(
                                "AutoBackupJob sẽ chạy vào: {nextRun} (UTC). Đợi {delayTotal:N0}ms ({hours}h {minutes}m {seconds}s)",
                                nextRun, delayBeforeRun.TotalMilliseconds, delayBeforeRun.Hours, delayBeforeRun.Minutes, delayBeforeRun.Seconds);

                            // Chờ cho đến khi đến giờ backup (nếu chưa đến)
                            if (delayBeforeRun.TotalMilliseconds > 0)
                            {
                                await Task.Delay(delayBeforeRun, stoppingToken);
                            }
                            else
                            {
                                _logger.LogInformation("Backup time đã qua, chạy ngay bây giờ");
                            }
                        }

                        // Thực thi backup
                        lock (_lockObject)
                        {
                            var timeSinceLastBackup = DateTime.UtcNow - _lastBackupTime;
                            if (timeSinceLastBackup.TotalMinutes < 1)
                            {
                                _logger.LogInformation("Backup was executed by another instance recently. Skipping this run.");
                            }
                            else
                            {
                                _lastBackupTime = DateTime.UtcNow;
                                try
                                {
                                    // Chạy backup pipeline (có thể async nhưng không chặn)
                                    _ = Task.Run(async () => await RunBackupPipelineAsync(backupService, retentionDays), stoppingToken);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "Lỗi khi bắt đầu backup pipeline");
                                }
                            }
                        }
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
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }
        }

        private DateTime CalculateNextRunTime(string frequency, string backupTime, string timezoneName = "SE Asia Standard Time")
        {
            var timeParts = backupTime.Split(':');
            if (timeParts.Length != 2 ||
                !int.TryParse(timeParts[0], out int hour) ||
                !int.TryParse(timeParts[1], out int minute))
            {
                hour = 2;
                minute = 0;
            }

            // Convert local time to UTC
            try
            {
                var timezone = TimeZoneInfo.FindSystemTimeZoneById(timezoneName);
                var now = DateTime.UtcNow;
                var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(now, timezone);
                
                // Create backup time in local timezone for TODAY, then convert to UTC
                var localBackupTimeToday = new DateTime(nowLocal.Year, nowLocal.Month, nowLocal.Day, hour, minute, 0);
                var utcBackupTimeToday = TimeZoneInfo.ConvertTimeToUtc(localBackupTimeToday, timezone);

                _logger.LogInformation(
                    "CalculateNextRunTime - Now UTC: {Now:yyyy-MM-dd HH:mm:ss}, Now Local: {NowLocal:yyyy-MM-dd HH:mm:ss}, LocalBackupTime: {LocalBackup:yyyy-MM-dd HH:mm:ss}, UTCBackupTime: {UTCBackup:yyyy-MM-dd HH:mm:ss}, Timezone: {TZ}, Frequency: {Frequency}",
                    now, nowLocal, localBackupTimeToday, utcBackupTimeToday, timezoneName, frequency);

                switch (frequency.ToLower())
                {
                    case "daily":
                        if (now < utcBackupTimeToday)
                        {
                            _logger.LogInformation("Daily: Backup time not reached today, next run: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", utcBackupTimeToday);
                            return utcBackupTimeToday;
                        }
                        var nextDay = utcBackupTimeToday.AddDays(1);
                        _logger.LogInformation("Daily: Backup time passed, next run tomorrow: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", nextDay);
                        return nextDay;

                    case "weekly":
                        var currentDayOfWeek = nowLocal.DayOfWeek;
                        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)currentDayOfWeek + 7) % 7;
                        
                        if (daysUntilMonday == 0)
                        {
                            if (now < utcBackupTimeToday)
                            {
                                _logger.LogInformation("Weekly: Monday, time not reached, next run: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", utcBackupTimeToday);
                                return utcBackupTimeToday;
                            }
                            var nextMonday = utcBackupTimeToday.AddDays(7);
                            _logger.LogInformation("Weekly: Monday, time passed, next run: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", nextMonday);
                            return nextMonday;
                        }
                        
                        var localMondayThisWeek = new DateTime(nowLocal.Year, nowLocal.Month, nowLocal.Day, hour, minute, 0).AddDays(daysUntilMonday);
                        var mondayThisWeek = TimeZoneInfo.ConvertTimeToUtc(localMondayThisWeek, timezone);
                        _logger.LogInformation("Weekly: Next Monday: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", mondayThisWeek);
                        return mondayThisWeek;

                    case "monthly":
                        var firstOfMonthLocal = new DateTime(nowLocal.Year, nowLocal.Month, 1, hour, minute, 0);
                        var utcFirstOfMonth = TimeZoneInfo.ConvertTimeToUtc(firstOfMonthLocal, timezone);
                        
                        if (now < utcFirstOfMonth)
                        {
                            _logger.LogInformation("Monthly: First of month not reached, next run: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", utcFirstOfMonth);
                            return utcFirstOfMonth;
                        }
                        var nextMonth = utcFirstOfMonth.AddMonths(1);
                        _logger.LogInformation("Monthly: First of month passed, next run: {NextRun:yyyy-MM-dd HH:mm:ss} UTC", nextMonth);
                        return nextMonth;

                    default:
                        if (now < utcBackupTimeToday)
                        {
                            return utcBackupTimeToday;
                        }
                        return utcBackupTimeToday.AddDays(1);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error with timezone {TZ}, falling back to UTC", timezoneName);
                // Fallback to UTC if timezone not found
                var now = DateTime.UtcNow;
                var todayBackupTime = new DateTime(now.Year, now.Month, now.Day, hour, minute, 0);
                
                if (now < todayBackupTime)
                    return todayBackupTime;
                return todayBackupTime.AddDays(1);
            }
        }

        private async Task RunBackupPipelineAsync(
            IBackupService backupService,
            int retentionDays)
        {
            _logger.LogInformation("=== START RunBackupPipelineAsync ===");
            _logger.LogInformation("Current UTC time: {UtcNow}", DateTime.UtcNow);
            
            try
            {
                _logger.LogInformation("[1/3] Bắt đầu tạo backup toàn bộ database (.bak)...");
                var backupLabel = $"db-backup-{DateTime.UtcNow:yyyyMMdd_HHmmss}";
                _logger.LogInformation("Backup label: {BackupLabel}", backupLabel);
                
                var backup = await backupService.CreateBackupAsync(backupLabel, "system");
                
                _logger.LogInformation("[1/3] SUCCESS - Đã tạo backup database");
                _logger.LogInformation("  - Path: {Path}", backup.FilePath);
                _logger.LogInformation("  - Size: {Size} bytes", backup.FileSize);
                _logger.LogInformation("  - Created: {CreatedAt}", backup.CreatedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[1/3] FAILED - Không thể tạo backup database");
                _logger.LogError("Exception Type: {ExceptionType}", ex.GetType().FullName);
                _logger.LogError("Exception Message: {Message}", ex.Message);
                _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);
                return;
            }

            // Xóa tất cả backup cũ, chỉ giữ bản mới nhất
            try
            {
                _logger.LogInformation("[2/3] Dọn dẹp backup cũ - chỉ giữ bản mới nhất...");
                var deletedCount = await backupService.CleanupOldBackupsAsync(0); // 0 = keep only latest
                _logger.LogInformation("[2/3] SUCCESS - Đã xóa {DeletedCount} bản backup cũ", deletedCount);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[2/3] FAILED - Lỗi khi dọn dẹp backup cũ");
                _logger.LogWarning("Exception: {Message}", ex.Message);
            }
            
            _logger.LogInformation("=== END RunBackupPipelineAsync ===");
        }
    }
}

