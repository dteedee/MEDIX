using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.UserManagement
{
    public class WalletService : IWalletService
    {

        private readonly IWalletRepository _walletRepository;

        public WalletService(IWalletRepository walletRepository)
        {
            _walletRepository = walletRepository;
        }

        public async Task<WalletDTo> CreateWalletAsync(WalletDTo walletDTo)
        {
            Wallet wallet = new Wallet
            {
                UserId = walletDTo.UserId,
                Balance = walletDTo.Balance,
                Currency = walletDTo.Currency,
                IsActive = walletDTo.IsActive,
                CreatedAt = walletDTo.CreatedAt,
                UpdatedAt = walletDTo.UpdatedAt
            };

            // Đợi tạo ví hoàn tất
            var result = await _walletRepository.CreateWalletAsync(wallet);

            // Trả về DTO
            WalletDTo resultDto = new WalletDTo
            {
                Id = result.Id,
                UserId = result.UserId,
                Balance = result.Balance,
                Currency = result.Currency,
                IsActive = result.IsActive,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt
            };

            return resultDto;
        }

       

        public Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
           return _walletRepository.DecreaseWalletBalanceAsync(userId, amount);
        }

        public Task<decimal> GetWalletBalanceAsync(Guid userId)
        {
          return  _walletRepository.GetWalletBalanceAsync(userId);
        }

        public Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
return _walletRepository.IncreaseWalletBalanceAsync(userId, amount);
        }
    }
}
