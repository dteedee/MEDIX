using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.BackgroundServices
{
    public class MedicationRemind : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MedicationRemind> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromDays(1); // Chạy mỗi 5 phút

        public MedicationRemind(
            IServiceProvider serviceProvider,
            ILogger<MedicationRemind> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MedicationRemind Background Service đang khởi động...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await UpdateExpiredReminders(stoppingToken);
                    
                    _logger.LogInformation(
                        "MedicationRemind Background Service chạy lúc: {time}, sẽ chạy lại sau {interval} phút",
                        DateTimeOffset.Now, _interval.TotalMinutes);

                    await Task.Delay(_interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("MedicationRemind Background Service đang dừng...");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong MedicationRemind Background Service: {message}", ex.Message);
                    
                    // Đợi trước khi retry để tránh loop lỗi liên tục
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("MedicationRemind Background Service đã dừng.");
        }

        private async Task UpdateExpiredReminders(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var repository = scope.ServiceProvider
                    .GetRequiredService<IPatientHealthReminderRepository>();

                var context = scope.ServiceProvider.GetRequiredService<MedixContext>();

                // Lấy tất cả reminder chưa hoàn thành và đã qua ScheduledDate
                var expiredReminders = await context.PatientHealthReminders
                    .Where(r => !r.IsCompleted && r.ScheduledDate < DateTime.Now)
                    .ToListAsync();

                if (expiredReminders.Any())
                {
                    _logger.LogInformation(
                        "Tìm thấy {count} reminder đã quá hạn, đang cập nhật...", 
                        expiredReminders.Count);

                    foreach (var reminder in expiredReminders)
                    {
                        reminder.IsCompleted = true;
                        reminder.CompletedAt = DateTime.Now;

                        await repository.updateReminder(reminder);

                        _logger.LogDebug(
                            "Đã cập nhật reminder ID: {id}, Title: {title}", 
                            reminder.Id, reminder.Title);
                    }

                    _logger.LogInformation(
                        "Đã cập nhật {count} reminder thành IsCompleted = true", 
                        expiredReminders.Count);
                }
            }
        }
    }
}