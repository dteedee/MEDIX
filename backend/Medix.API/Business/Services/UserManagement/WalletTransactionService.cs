using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.Business.Services.UserManagement
{
    public class WalletTransactionService : IWalletTransactionService

    {

        private readonly IWalletTransactionRepository walletTransactionRepository;

        public WalletTransactionService(IWalletTransactionRepository walletTransactionRepository)
        {
            this.walletTransactionRepository = walletTransactionRepository;
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

            // await trả về entity đã lưu (không phải Task nữa)
            var saved = await walletTransactionRepository.CreateWalletTransactionAsync(trans);

            // map entity -> DTO (dùng trực tiếp saved, không saved.Result)
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

            return resultDto;
        }

     
    }
}
