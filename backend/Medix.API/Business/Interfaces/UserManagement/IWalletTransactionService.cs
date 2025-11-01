using Medix.API.Models.DTOs.Wallet;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IWalletTransactionService
    {
        public  Task<WalletTransactionDto> createWalletTransactionAsync(WalletTransactionDto walletTransactionDto);
    }
}
