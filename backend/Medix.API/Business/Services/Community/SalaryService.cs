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
                        var salary = doctor.Appointments
                            .Select(a => a.TotalAmount)
                            .Sum();
                        decimal netSalary = 0;
                        if (doctor.isSalaryDeduction == true)
                        {
                            netSalary = salary * ((decimal)Constants.DoctorSalaryShare) * 0.8m;
                        }// số thực về tài khoản bác sĩ
                        else
                        {
                            netSalary = salary * ((decimal)Constants.DoctorSalaryShare);
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

                        //add to balance
                        if (!await _walletRepository.IncreaseWalletBalanceAsync(doctor.UserId, netSalary))
                        {
                            throw new Exception("Failed to increase balance");
                        };

                        //add to wallet transaction
                        var wallet = await _walletRepository.GetWalletByUserIdAsync(doctor.UserId) 
                            ?? throw new Exception("Cant find wallet");
                        var walletTransaction = new WalletTransaction
                        {
                            WalletId = wallet.Id,
                            TransactionTypeCode = "DoctorSalary",
                            Amount = netSalary,
                            BalanceBefore = wallet.Balance,
                            BalanceAfter = wallet.Balance+netSalary ,
                            Status = "Completed",
                            Description = "Paid for doctor salary",
                        };
                        await _walletTransactionRepository.CreateWalletTransactionAsync(walletTransaction);

                        //commit
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
