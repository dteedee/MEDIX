using Medix.API.Models.DTOs.Wallet;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IWalletService
    {
        public   Task<WalletDTo> CreateWalletAsync(WalletDTo wallet);
        public Task<decimal> GetWalletBalanceAsync(Guid userId);
        public Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount);
        public Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount);
        public Task<WalletDTo?> GetWalletByUserIdAsync(Guid userId);
    }
}
