using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Community
{
    public class SalaryService : ISalaryService
    {
        private readonly MedixContext _context;
        private readonly ILogger<SalaryService> _logger;

        private readonly IDoctorRepository _doctorRepository;
        private readonly IDoctorSalaryRepository _salaryRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IWalletTransactionRepository _walletTransactionRepository;

        public SalaryService(
            MedixContext context,
            ILogger<SalaryService> logger,
            IDoctorRepository doctorRepository,
            IDoctorSalaryRepository salaryRepository,
            IWalletRepository walletRepository,
            IWalletTransactionRepository walletTransactionRepository
            )
        {
            _context = context;
            _logger = logger;

            _doctorRepository = doctorRepository;
            _salaryRepository = salaryRepository;
            _walletRepository = walletRepository;
            _walletTransactionRepository = walletTransactionRepository;
        }

        public async Task CalculateSalary(DateTime date)
        {
            var anyFailed = false;
            var doctors = await _doctorRepository.GetAllAsync();

            foreach (var doctor in doctors)
            {
                if (!await _salaryRepository.IsDoctorSalaryPaid(doctor.Id, date))
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Check if we need to apply next month's fee and commission rate
                        var currentMonth = new DateTime(date.Year, date.Month, 1);
                        var shouldApplyNextMonthSettings = false;

                        if (doctor.LastCommissionUpdateMonth.HasValue)
                        {
                            var lastUpdateMonth = new DateTime(
                                doctor.LastCommissionUpdateMonth.Value.Year,
                                doctor.LastCommissionUpdateMonth.Value.Month,
                                1);

                            // If current month is after the update month, apply the new settings
                            if (currentMonth > lastUpdateMonth)
                            {
                                shouldApplyNextMonthSettings = true;
                            }
                        }

                        // Apply next month's settings if applicable
                        if (shouldApplyNextMonthSettings)
                        {
                            if (doctor.NextMonthConsultationFee.HasValue)
                            {
                                doctor.ConsultationFee = doctor.NextMonthConsultationFee.Value;
                                doctor.NextMonthConsultationFee = null;
                            }

                            if (doctor.NextMonthCommissionRate.HasValue)
                            {
                                doctor.CommissionRate = doctor.NextMonthCommissionRate.Value;
                                doctor.NextMonthCommissionRate = null;
                            }

                            // Reset LastCommissionUpdateMonth to allow updates in the new month
                            doctor.LastCommissionUpdateMonth = null;
                            doctor.UpdatedAt = DateTime.UtcNow;
                            await _doctorRepository.UpdateDoctorAsync(doctor);
                        }

                        var salary = doctor.Appointments.Where(p => p.StatusCode == "Completed" || p.StatusCode == "CancelledByPatient")
                            .Select(a => a.TotalAmount)
                            .Sum();

                        // Use commission rate from doctor if set, otherwise use default
                        var commissionRate = doctor.CommissionRate ?? (decimal)Constants.DoctorSalaryShare;
                        var netSalary = salary * commissionRate;

                        if ((bool)doctor.isSalaryDeduction)
                        {
                            var commission = salary * (1 - commissionRate);
                            var deduction = salary * 0.2m;
                            netSalary = salary - commission - deduction;
                            doctor.isSalaryDeduction = false;
                            await _doctorRepository.UpdateDoctorAsync(doctor);
                        }// số thực về tài khoản bác sĩ
                        else
                        {
                            netSalary = salary * commissionRate;
                        }

                        //insert into doctor salary
                        var doctorSalary = new DoctorSalary
                        {
                            DoctorId = doctor.Id,
                            PeriodStartDate = DateOnly.FromDateTime(Helpers.GetFirstDayOfMonth(date)),
                            PeriodEndDate = DateOnly.FromDateTime(Helpers.GetLastDayOfMonth(date)),
                            TotalAppointments = doctor.Appointments.Count(),
                            TotalEarnings = salary,
                            CommissionDeductions = salary - netSalary,
                            NetSalary = netSalary,
                            Status = "Paid",
                            PaidAt = DateTime.UtcNow,
                        };
                        await _salaryRepository.CreateAsync(doctorSalary);

                        if (!await _walletRepository.IncreaseWalletBalanceAsync(doctor.UserId, netSalary))
                        {
                            throw new Exception("Failed to increase balance");
                        }
                        ;

                        var wallet = await _walletRepository.GetWalletByUserIdAsync(doctor.UserId)
                            ?? throw new Exception("Cant find wallet");
                        var walletTransaction = new WalletTransaction
                        {
                            WalletId = wallet.Id,
                            TransactionTypeCode = "DoctorSalary",
                            Amount = netSalary,
                            BalanceBefore = wallet.Balance,
                            BalanceAfter = wallet.Balance + netSalary,
                            Status = "Completed",
                            Description = "Thanh toán lương trong khoảng thời gian " + DateOnly.FromDateTime(Helpers.GetFirstDayOfMonth(date)).ToString() + " tới " + DateOnly.FromDateTime(Helpers.GetLastDayOfMonth(date)).ToString(),
                        };
                        await _walletTransactionRepository.CreateWalletTransactionAsync(walletTransaction);

                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        anyFailed = true;
                        _logger.LogError(ex, $"Failed to calculate salary for doctor with id = {doctor.Id}");
                        await transaction.RollbackAsync();
                    }
                }
            }

            if (anyFailed)
            {
                throw new Exception("Calculate salary for some doctors failed. Hangfire will retry again later");
            }
        }

    }
}
