using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public interface IWalletTransactionRepository
    {
        public Task<WalletTransaction> CreateWalletTransactionAsync(WalletTransaction walletTransaction);
    }
}
