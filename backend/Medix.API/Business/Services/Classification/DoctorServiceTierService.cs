using Hangfire;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorServiceTierService : IDoctorServiceTierService
    {
        private readonly IServiceTierRepository _serviceTierRepository;
        private readonly IDoctorRepository _doctorRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IServiceTierSubscriptionsRepository _subscriptionsRepository;
        private readonly IWalletTransactionRepository _walletTransactionRepository;
        private readonly MedixContext _context;
        private readonly ILogger<DoctorServiceTierService> _logger;

        public DoctorServiceTierService(
            IServiceTierRepository serviceTierRepository,
            IDoctorRepository doctorRepository,
            MedixContext context,
            IWalletRepository walletRepository,
            IServiceTierSubscriptionsRepository subscriptionsRepository,
            IWalletTransactionRepository walletTransactionRepository,
            ILogger<DoctorServiceTierService> logger)
        {
            _serviceTierRepository = serviceTierRepository;
            _doctorRepository = doctorRepository;
            _context = context;
            _walletRepository = walletRepository;
            _subscriptionsRepository = subscriptionsRepository;
            _walletTransactionRepository = walletTransactionRepository;
            _logger = logger;
        }

        public async Task<ServiceTierPresenter> GetDisplayedTierForDoctor(Guid userId)
        {
            var doctor = await _doctorRepository.GetDoctorByUserIdAsync(userId);
            var list = await _serviceTierRepository.GetActiveTiersAsync();
            var balance = await _walletRepository.GetWalletBalanceAsync(userId);

            if (doctor == null)
            {
                throw new Exception($"Doctor with userId = {userId} not found");
            }

            var currentSubscription = await _subscriptionsRepository.GetCurrentSubscriptionOfDoctorAsync(doctor.Id);

            return new ServiceTierPresenter
            {
                ServiceTierList = list.Where(st => st.PriorityBoost >= doctor?.ServiceTier?.PriorityBoost).ToList(),
                CurrentTierId = doctor?.ServiceTierId,
                Balance = balance,
                ExpiredAt = currentSubscription?.EndDate,
                CurrentSubscriptionActive = currentSubscription != null && currentSubscription.Status == "Active"
            };
        }

        public async Task Upgrade(Guid userId, Guid serviceTierId)
        {
            var serviceTier = await _serviceTierRepository.GetByIdAsync(serviceTierId);
            var doctor = await _doctorRepository.GetDoctorByUserIdAsync(userId);

            if (serviceTier == null || doctor == null)
            {
                throw new Exception("Doctor / Service tier can not be found");
            }

            //if current service tier is higher than purchased tier, cancel
            if (doctor.ServiceTier == null)
            {
                throw new Exception("Unexpected error");
            }
            else if (doctor.ServiceTier.PriorityBoost > serviceTier.PriorityBoost)
            {
                throw new MedixException("Gói dịch vụ hiện tại của bạn có giá trị cao hơn gói bạn muốn mua.");
            }

            //if another subscription exists
            var currentSubscription = await _subscriptionsRepository.GetCurrentSubscriptionOfDoctorAsync(doctor.Id);
            if (currentSubscription != null)
            {
                //if new subscription is of the same value
                if (doctor.ServiceTier.PriorityBoost == serviceTier.PriorityBoost)
                {
                    if (currentSubscription.Status != "Expired")
                    {
                        //resume next month subscription at Cancelled
                        if (currentSubscription.Status == "Cancelled")
                        {
                            currentSubscription.Status = "Active";
                            await _subscriptionsRepository.UpdateSubscriptionAsync(currentSubscription);
                        }
                        //no adding subscription add Cancelled / Active
                        return;
                    }
                }
                //bigger
                else
                {
                    //deactivate the lower subscription
                    if (currentSubscription.Status == "Active")
                    {
                        currentSubscription.Status = "Cancelled";
                        await _subscriptionsRepository.UpdateSubscriptionAsync(currentSubscription);
                    }
                }
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            var committed = false;

            try
            {
                //update doctor table
                doctor.ServiceTierId = serviceTierId;
                doctor.ServiceTier = null;
                await _doctorRepository.UpdateDoctorAsync(doctor);

                //add to subscription table
                var newSubscription = await CreateNewSubscription(doctor.Id, serviceTierId);

                //decrease balance
                var balance = await _walletRepository.GetWalletBalanceAsync(userId);
                if (balance < serviceTier.MonthlyPrice)
                {
                    throw new MedixException("Bạn không có đủ số dư trong ví");
                }
                await _walletRepository.DecreaseWalletBalanceAsync(userId, serviceTier.MonthlyPrice);

                await transaction.CommitAsync();
                committed = true;

                //add to tranasction
                var wallet = await _walletRepository.GetWalletByUserIdAsync(userId);
                var walletTransaction = new WalletTransaction
                {
                    WalletId = wallet.Id,
                    TransactionTypeCode = "SystemCommission",
                    Amount = serviceTier.MonthlyPrice,
                    BalanceBefore = balance,
                    BalanceAfter = balance - serviceTier.MonthlyPrice,
                    Status = "Completed",
                    Description = $"Doctor {doctor.User.FullName} paid for service tier {serviceTier.Name}"
                };
                await _walletTransactionRepository.CreateWalletTransactionAsync(walletTransaction);

                //schedule next renewal
                if (newSubscription != null)
                {
                    BackgroundJob.Schedule<IDoctorServiceTierService>(
                        service => service.RenewSubscription(newSubscription.Id),
                        TimeSpan.FromDays(30)
                    );
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Commit exception");
                if (!committed)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
        }

        public async Task Unsubscribe(Guid userId, Guid serviceTierId)
        {
            var doctor = await _doctorRepository.GetDoctorByUserIdAsync(userId)
                ?? throw new Exception($"Doctor with userId = {userId} can not be found");

            var subscription = await _subscriptionsRepository.GetActiveSubscriptionOfDoctorAsync(doctor.Id);
            if (subscription == null || subscription.ServiceTierId != serviceTierId)
            {
                throw new Exception($"Active subscription with userId = {userId} & serviceTierId = {serviceTierId} can not be found");
            }

            subscription.Status = "Cancelled";
            await _subscriptionsRepository.UpdateSubscriptionAsync(subscription);
        }

        public async Task RenewSubscription(Guid subscriptionId)
        {

            ServiceTierSubscription? currentSubscription;
            Doctor? doctor;

            try
            {
                currentSubscription = await _subscriptionsRepository.GetByIdAsync(subscriptionId);
                if (currentSubscription != null)
                {
                    if (currentSubscription.Status == "Active")
                    {
                        //set current subcription to expired
                        currentSubscription.Status = "Expired";
                        await _subscriptionsRepository.UpdateSubscriptionAsync(currentSubscription);
                    }
                    else
                    {
                        //update doctor table
                        doctor = await _doctorRepository.GetDoctorByIdAsync(currentSubscription.DoctorId);
                        if (doctor != null)
                        {
                            await SetServiceTierToBasic(doctor);
                        }
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to set current subscription with id = {subscriptionId} to expired.");
                return;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            var committed = false;

            try
            {
                if (currentSubscription == null)
                {
                    throw new Exception($"Failed to get subscription with id = {subscriptionId}");
                }

                //decrease balance
                var serviceTier = await _serviceTierRepository.GetByIdAsync(currentSubscription.ServiceTierId);
                doctor = await _doctorRepository.GetDoctorByIdAsync(currentSubscription.DoctorId);

                if (serviceTier == null || doctor == null)
                {
                    throw new Exception("Doctor / Service tier can not be found");
                }

                var balance = await _walletRepository.GetWalletBalanceAsync(doctor.User.Id);
                if (balance < serviceTier.MonthlyPrice)
                {
                    await SetServiceTierToBasic(doctor);
                    throw new MedixException("Bạn không có đủ số dư trong ví");
                }
                await _walletRepository.DecreaseWalletBalanceAsync(doctor.User.Id, serviceTier.MonthlyPrice);

                //create new subscription
                var newSubscription = await CreateNewSubscription(currentSubscription.DoctorId, currentSubscription.ServiceTierId);

                await transaction.CommitAsync();
                committed = true;

                //add transaction
                var wallet = await _walletRepository.GetWalletByUserIdAsync(doctor.User.Id);
                var walletTransaction = new WalletTransaction
                {
                    WalletId = wallet.Id,
                    TransactionTypeCode = "SystemCommission",
                    Amount = serviceTier.MonthlyPrice,
                    BalanceBefore = balance,
                    BalanceAfter = balance - serviceTier.MonthlyPrice,
                    Status = "Completed",
                    Description = $"Doctor {doctor.User.FullName} renew service tier {serviceTier.Name}"
                };
                await _walletTransactionRepository.CreateWalletTransactionAsync(walletTransaction);

                // schedule next renewal
                if (newSubscription != null)
                {
                    BackgroundJob.Schedule<IDoctorServiceTierService>(
                        service => service.RenewSubscription(newSubscription.Id),
                        TimeSpan.FromDays(30)
                    );
                }
            }
            catch (MedixException)
            {
                _logger.LogInformation("================================no funds=============================");
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to renew subscription with id = {subscriptionId}");
                if (!committed)
                {
                    await transaction.RollbackAsync();
                }
            }
        }

        private async Task<ServiceTierSubscription?> CreateNewSubscription(Guid doctorId, Guid serviceTierId)
        {
            var subscription = new ServiceTierSubscription
            {
                DoctorId = doctorId,
                ServiceTierId = serviceTierId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30),
                Status = "Active"
            };
            return await _subscriptionsRepository.CreateAsync(subscription);
        }

        private async Task SetServiceTierToBasic(Doctor doctor)
        {
            var basicServiceTier = await _serviceTierRepository.GetServiceTierByNameAsync("Basic");
            doctor.ServiceTierId = basicServiceTier?.Id;
            doctor.ServiceTier = null;
            await _doctorRepository.UpdateDoctorAsync(doctor);
        }

        public async Task<List<DoctorServiceTierDetailDto>> GetAllServiceTiers()
        {
            var list = await _serviceTierRepository.GetAllAsync();

            return list.Select(st => new DoctorServiceTierDetailDto
            {
                ServiceTierId = st.Id,
                Name = st.Name,
                Description = st.Description,
                ConsultationFeeMultiplier = st.ConsultationFeeMultiplier,
                PriorityBoost = st.PriorityBoost,
                MaxDailyAppointments = st.MaxDailyAppointments,
                Features = st.Features,
                MonthlyPrice = st.MonthlyPrice,
                IsActive = st.IsActive
            }).ToList();
        }
        public async Task UpdateServiceTier(UpdateServiceTierRequest request)
        {
            var tier = await _serviceTierRepository.GetByIdAsync(request.ServiceTierId);

            if (tier == null)
            {
                throw new MedixException("Service tier not found");
            }

            tier.Description = request.Description;
            tier.MonthlyPrice = request.MonthlyPrice;

            await _serviceTierRepository.UpdateAsync(tier);
        }
        public async Task<DoctorServiceTierDetailDto?> GetServiceTierDetail(Guid serviceTierId)
        {
            var tier = await _serviceTierRepository.GetByIdAsync(serviceTierId);

            if (tier == null)
                return null;

            return new DoctorServiceTierDetailDto
            {
                ServiceTierId = tier.Id,
                Name = tier.Name,
                Description = tier.Description,
                ConsultationFeeMultiplier = tier.ConsultationFeeMultiplier,
                PriorityBoost = tier.PriorityBoost,
                MaxDailyAppointments = tier.MaxDailyAppointments,
                Features = tier.Features,
                MonthlyPrice = tier.MonthlyPrice,
                IsActive = tier.IsActive
            };
        }



    }
}
