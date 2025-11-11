using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public interface IWalletTransactionRepository
    {
        public Task<WalletTransaction> CreateWalletTransactionAsync(WalletTransaction walletTransaction);
        public Task<WalletTransaction?> GetWalletTransactionByOrderCodeAsync(long orderCode);
        public Task<WalletTransaction?> UpdateWalletTransactionAsync(WalletTransaction walletTransaction);

        public Task<List<WalletTransaction>> GetTransactionsByWalletIdAsync(Guid walletId);

        public Task<WalletTransaction> GetWalletTransactionByIdAsync(Guid id);
    }
}
