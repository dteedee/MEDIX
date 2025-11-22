
using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.BackgroundServices
{
    public class JobBannedDoctor : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobBannedDoctor> _logger;

        public JobBannedDoctor(
            IServiceProvider serviceProvider,
            ILogger<JobBannedDoctor> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
                _logger.LogInformation("JobBannedDoctor Background Service đang khởi động...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextThursday = GetNextThursday(now);

                    var delay = nextThursday - now;
                    await Task.Delay(delay, stoppingToken);

                    // ✅ SAU ĐÓ đánh giá và ban doctor
                    await CheckAndBanDoctors(stoppingToken);
        

                    _logger.LogInformation("JobBannedDoctor đã hoàn thành. Sẽ chạy lại vào thứ 5 tuần sau.");
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("JobBannedDoctor đang dừng...");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong JobBannedDoctor: {message}", ex.Message);
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("JobBannedDoctor đã dừng.");
        }

   

        private async Task CheckAndBanDoctors(CancellationToken stoppingToken)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MedixContext>();

                var doctors = await context.Doctors
                    .Where(d => d.IsVerified)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Bắt đầu kiểm tra {count} doctor...", doctors.Count);

                int salaryDeductionCount = 0;
                int bannedCount = 0;
                int permanentBannedCount = 0;

                foreach (var doctor in doctors)
                {
                    bool updated = false;

                    // ✅ Giới hạn NextWeekMiss tối đa 2
                    if (doctor.TotalCaseMissPerWeek ==3)
                    { 

                        doctor.NextWeekMiss = 1;
                        updated = true;
                    }


                    if (doctor.TotalCaseMissPerWeek == 2  )
                    {
                        if ((bool)!doctor.isSalaryDeduction)
                        {
                            doctor.isSalaryDeduction = true;
                            salaryDeductionCount++;
                            updated = true;

                            _logger.LogWarning(
                                "Doctor {doctorId} ({name}) bị khấu trừ lương do miss {miss} appointment",
                                doctor.Id, doctor.User?.FullName ?? "N/A", doctor.TotalCaseMissPerWeek);
                        }
                    }

                    // ✅ RULE 2: Nếu miss >= 3 lần → Ban từ thứ 2 - CN tuần sau
                    if (doctor.TotalCaseMissPerWeek >= 3)
                    {
                        var nextMonday = GetNextMonday(DateTime.Now);
                        var nextSunday = nextMonday.AddDays(6).Date.AddHours(12).AddMinutes(59).AddSeconds(59);

                        doctor.StartDateBanned = nextMonday;
                        doctor.TotalBanned += 1;
                        bannedCount++;
                        updated = true;

                        // ✅ RULE 3: Nếu TotalBanned >= 2 → Ban vĩnh viễn
                        if (doctor.TotalBanned >= 2)
                        {
                            doctor.EndDateBanned = DateTime.Now.AddYears(100);
                            doctor.IsAcceptingAppointments = false;
                            permanentBannedCount++;

                            _logger.LogError(
                                "Doctor {doctorId} ({name}) bị BAN VĨNH VIỄN do vi phạm {total} lần. EndDate: {endDate}",
                                doctor.Id, doctor.User?.FullName ?? "N/A", doctor.TotalBanned, doctor.EndDateBanned);
                        }
                        else
                        {
                            doctor.EndDateBanned = nextSunday;
                            doctor.IsAcceptingAppointments = false;

                            _logger.LogWarning(
                                "Doctor {doctorId} ({name}) bị BAN từ {start} đến {end} (Lần {count})",
                                doctor.Id, doctor.User?.FullName ?? "N/A",
                                doctor.StartDateBanned, doctor.EndDateBanned, doctor.TotalBanned);
                        }
                    }

                    if (updated)
                    {
                        doctor.UpdatedAt = DateTime.UtcNow;
                    }

                 
                    doctor.TotalCaseMissPerWeek = 0;
                }

                await context.SaveChangesAsync(stoppingToken);

                _logger.LogInformation(
                    "JobBannedDoctor hoàn thành:\n" +
                    "- Khấu trừ lương: {salary} doctor\n" +
                    "- Ban tạm thời: {temp} doctor\n" +
                    "- Ban vĩnh viễn: {permanent} doctor\n" +
                    "- Đã kiểm tra: {total} doctor",
                    salaryDeductionCount, bannedCount - permanentBannedCount,
                    permanentBannedCount, doctors.Count);
            }
        }

        private DateTime GetNextThursday(DateTime now)
        {
            var daysUntilThursday = ((int)DayOfWeek.Thursday - (int)now.DayOfWeek + 7) % 7;

            if (daysUntilThursday == 0 && now.Hour >= 12)
            {
                daysUntilThursday = 7;
            }

            var nextThursday = now.Date.AddDays(daysUntilThursday).AddHours(12);
            return nextThursday;
        }

        private DateTime GetNextMonday(DateTime now)
        {
            var daysUntilNextMonday = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;

            if (daysUntilNextMonday == 0)
            {
                daysUntilNextMonday = 7;
            }

            var nextMonday = now.Date.AddDays(daysUntilNextMonday);
            return nextMonday;
        }
    }
}