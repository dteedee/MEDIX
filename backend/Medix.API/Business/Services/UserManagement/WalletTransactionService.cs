using Hangfire;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using System.Net.WebSockets;

namespace Medix.API.Business.Services.UserManagement
{
    public class WalletTransactionService : IWalletTransactionService

    {

        private readonly IWalletTransactionRepository walletTransactionRepository;
        private readonly ITransferTransactionRepository transferTransactionRepository;
        private readonly IWalletRepository walletRepository;

        public WalletTransactionService(IWalletTransactionRepository walletTransactionRepository, ITransferTransactionRepository transferTransactionRepository, IWalletRepository walletRepository)
        {
            this.walletTransactionRepository = walletTransactionRepository;
            this.transferTransactionRepository = transferTransactionRepository;
            this.walletRepository = walletRepository;
        }

        public async Task<WalletTransactionDto> createWalletTransactionAsync(WalletTransactionDto walletTransactionDto)
        {
            var trans = new WalletTransaction
            {
                Id = walletTransactionDto.id ?? Guid.NewGuid(),
                WalletId = walletTransactionDto.walletId ?? Guid.NewGuid(),
                TransactionTypeCode = walletTransactionDto.TransactionTypeCode ?? string.Empty,
                Amount = walletTransactionDto.Amount ?? 0,
                BalanceBefore = walletTransactionDto.BalanceBefore ?? 0,
                Status = walletTransactionDto.Status ?? "Pending",
                OrderCode = walletTransactionDto.orderCode,
                RelatedAppointmentId = walletTransactionDto.RelatedAppointmentId,
                Description = walletTransactionDto.Description,
                TransactionDate = walletTransactionDto.TransactionDate ?? DateTime.UtcNow,
                CreatedAt = walletTransactionDto.CreatedAt ?? DateTime.UtcNow
            };

            var saved = await walletTransactionRepository.CreateWalletTransactionAsync(trans);

            var resultDto = new WalletTransactionDto
            {
                id = saved.Id,
                walletId = saved.WalletId,
                TransactionTypeCode = saved.TransactionTypeCode,
                Amount = saved.Amount,
                BalanceBefore = saved.BalanceBefore,
                Status = saved.Status,
                RelatedAppointmentId = saved.RelatedAppointmentId,
                Description = saved.Description,
                orderCode = saved.OrderCode,
                TransactionDate = saved.TransactionDate,
                CreatedAt = saved.CreatedAt
            };


            if (walletTransactionDto.TransactionTypeCode== "Withdrawal" && walletTransactionDto.Status == "Pending")
            {
                BackgroundJob.Schedule<IWalletTransactionService>(
                 service => service.CheckApproveMoney((Guid)resultDto.id),
                DateTime.Now.AddDays(1));
            }
         
            if (walletTransactionDto.TransactionTypeCode == "Deposit" && walletTransactionDto.Status == "Pending")
            {
                BackgroundJob.Schedule<IWalletTransactionService>(
                 service => service.CheckDepositMoney((Guid)resultDto.id),
                DateTime.Now.AddMinutes(5));
            }
            return resultDto;
        }

        public async Task<WalletTransactionDto?> GetWalletTransactionByOrderCodeAsync(long orderCode)
        {
            var trans = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(orderCode);

            if (trans == null)
            {
                return null;
            }

            return new WalletTransactionDto
            {
                id = trans.Id,
                walletId = trans.WalletId,
                orderCode = trans.OrderCode,
                TransactionTypeCode = trans.TransactionTypeCode,
                Amount = trans.Amount,
                BalanceBefore = trans.BalanceBefore,
                BalanceAfter = trans.BalanceAfter,
                Status = trans.Status,
                RelatedAppointmentId = trans.RelatedAppointmentId,
                Description = trans.Description,
                TransactionDate = trans.TransactionDate,
                CreatedAt = trans.CreatedAt
            };
        }

        public async Task<WalletTransactionDto?> UppdateWalletTrasactionAsync(WalletTransactionDto walletTransactionDto)
        {

    

            WalletTransaction? transToUpdate = null;

            if (walletTransactionDto.id.HasValue)
            {
                transToUpdate = await walletTransactionRepository.GetWalletTransactionByIdAsync(walletTransactionDto.id.Value);
            }
            else if (walletTransactionDto.orderCode.HasValue)
            {
                transToUpdate = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(walletTransactionDto.orderCode.Value);
            }

            if (transToUpdate == null)
            {
                return null; 
            }


            transToUpdate.WalletId = walletTransactionDto.walletId ?? transToUpdate.WalletId;
            transToUpdate.TransactionTypeCode = walletTransactionDto.TransactionTypeCode ?? transToUpdate.TransactionTypeCode;
            transToUpdate.Amount = walletTransactionDto.Amount ?? transToUpdate.Amount;
            transToUpdate.BalanceBefore = walletTransactionDto.BalanceBefore ?? transToUpdate.BalanceBefore;
            transToUpdate.BalanceAfter = walletTransactionDto.BalanceAfter; 
            transToUpdate.Status = walletTransactionDto.Status ?? "Pending";
            transToUpdate.RelatedAppointmentId = walletTransactionDto.RelatedAppointmentId;
            transToUpdate.Description = walletTransactionDto.Description;
           
            var updated = await walletTransactionRepository.UpdateWalletTransactionAsync(transToUpdate);

            if (updated == null)
            {
                return null;
            }

           
            return new WalletTransactionDto
            {
                id = updated.Id,
                walletId = updated.WalletId,
                orderCode = updated.OrderCode,
                TransactionTypeCode = updated.TransactionTypeCode,
                Amount = updated.Amount,
                BalanceBefore = updated.BalanceBefore,
                BalanceAfter = updated.BalanceAfter,
                Status = updated.Status,
                RelatedAppointmentId = updated.RelatedAppointmentId,
                Description = updated.Description,
                TransactionDate = updated.TransactionDate,
                CreatedAt = updated.CreatedAt
            };
        }


        public async Task<bool> UpdateTransactionStatusByOrderCodeAsync(long orderCode, string status, decimal? balanceBefore = null, decimal? balanceAfter = null, string? additionalDescription = null)
        {
            try
            {
                var transaction = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(orderCode);
                if (transaction == null)
                {
                    return false;
                }

                transaction.Status = status;
                if (balanceBefore.HasValue)
                    transaction.BalanceBefore = balanceBefore.Value;
                if (balanceAfter.HasValue)
                    transaction.BalanceAfter = balanceAfter.Value;
                if (!string.IsNullOrEmpty(additionalDescription))
                    transaction.Description += additionalDescription;

                var updatedTransaction = await walletTransactionRepository.UpdateWalletTransactionAsync(transaction);
                return updatedTransaction != null;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<WalletTransactionDto>> GetTransactionsByWalletIdAsync(Guid walletId)
        {
            try
            {
                var transactions = await walletTransactionRepository.GetTransactionsByWalletIdAsync(walletId);

                if (transactions == null || !transactions.Any())
                {
                    return new List<WalletTransactionDto>();
                }

                var transactionDtos = transactions.Select(trans => new WalletTransactionDto
                {
                    id = trans.Id,
                    walletId = trans.WalletId,
                    orderCode = trans.OrderCode,
                    TransactionTypeCode = trans.TransactionTypeCode,
                    Amount = trans.Amount,
                    BalanceBefore = trans.BalanceBefore,
                    BalanceAfter = trans.BalanceAfter,
                    Status = trans.Status,
                    RelatedAppointmentId = trans.RelatedAppointmentId,
                    Description = trans.Description,
                    TransactionDate = trans.TransactionDate,
                    CreatedAt = trans.CreatedAt
                }).ToList();

                return transactionDtos;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting transactions for wallet {walletId}: {ex.Message}");
                return new List<WalletTransactionDto>();
            }
        }

        public async Task<WalletTransactionDto> GetWalletTransactionByIdAsync(Guid id)
        {
            var transaction = await walletTransactionRepository.GetWalletTransactionByIdAsync(id);

            if (transaction == null)
            {
                throw new InvalidOperationException($"WalletTransaction with ID {id} not found.");
            }

            return new WalletTransactionDto
            {
                id = transaction.Id,
                walletId = transaction.WalletId,
                orderCode = transaction.OrderCode,
                TransactionTypeCode = transaction.TransactionTypeCode,
                Amount = transaction.Amount,
                BalanceBefore = transaction.BalanceBefore,
                BalanceAfter = transaction.BalanceAfter,
                Status = transaction.Status,
                RelatedAppointmentId = transaction.RelatedAppointmentId,
                Description = transaction.Description,
                TransactionDate = transaction.TransactionDate,
                CreatedAt = transaction.CreatedAt
            };
        }

        public async Task CheckApproveMoney(Guid walletTransID)
        {
        var wallettransaction = await walletTransactionRepository.GetWalletTransactionByIdAsync(walletTransID);

            var transferTransaction = await transferTransactionRepository.GetTransferTransactionWithWalletTransID(walletTransID);
            var wallet = await walletRepository.GetWalletByIdAsync(wallettransaction.WalletId);
            if (wallettransaction.TransactionTypeCode == "Withdrawal" && wallettransaction.Status == "Pending")
            {
                wallettransaction.Status = "Failed";
                wallettransaction.Description += "Bị từ chối";

                await walletTransactionRepository.UpdateWalletTransactionAsync(wallettransaction);

                transferTransaction.Status = "Rejected";
                transferTransaction.Description += "Bị từ chối";

                await transferTransactionRepository.UpdateTransferTransaction(transferTransaction);
                await walletRepository.IncreaseWalletBalanceAsync(wallet.UserId, transferTransaction.Amount);

            }
        }
        public async Task CheckDepositMoney(Guid walletTransID)
        {
            var wallettransaction = await walletTransactionRepository.GetWalletTransactionByIdAsync(walletTransID);
            if  (wallettransaction.TransactionTypeCode == "Deposit" && wallettransaction.Status == "Pending")
            {
                wallettransaction.Status = "Failed";
                wallettransaction.Description += "Hủy giao dịch do người dùng không thanh toán";
                await walletTransactionRepository.UpdateWalletTransactionAsync(wallettransaction);
            }
        }

    }
}
