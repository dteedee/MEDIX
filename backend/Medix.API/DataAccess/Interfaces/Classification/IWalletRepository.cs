using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IWalletRepository
    {
     public  Task<decimal> GetWalletBalanceAsync(Guid userId);
        public Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount);
        public Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount);
        public Task<bool> DeleteWalletBalanceAsync(Guid userId,decimal amount);

        public Task<Wallet> CreateWalletAsync(Wallet wallet);

    }
}
