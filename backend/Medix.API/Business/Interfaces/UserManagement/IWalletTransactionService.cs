using Medix.API.Models.DTOs.Wallet;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IWalletTransactionService
    {
        public  Task<WalletTransactionDto> createWalletTransactionAsync(WalletTransactionDto walletTransactionDto);
        public Task<WalletTransactionDto?> GetWalletTransactionByOrderCodeAsync(long orderCode);
        public Task<WalletTransactionDto?> UppdateWalletTrasactionAsync(WalletTransactionDto walletTransactionDto);
        public Task<List<WalletTransactionDto>> GetTransactionsByWalletIdAsync(Guid walletId);

        public Task<bool> UpdateTransactionStatusByOrderCodeAsync(long orderCode, string status, decimal? balanceBefore = null, decimal? balanceAfter = null, string? additionalDescription = null);

    }
}
