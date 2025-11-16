using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Wallet;
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

        public async Task<WalletDTo?> GetWalletByIdAsync(Guid walletId)
        {
            // 1. Gọi repository để lấy Wallet Entity
            var wallet = await _walletRepository.GetWalletByIdAsync(walletId);

            // 2. Nếu không tìm thấy, trả về null
            if (wallet == null)
            {
                return null;
            }

            // 3. Nếu tìm thấy, ánh xạ từ Entity sang DTO
            return new WalletDTo
            {
                Id = wallet.Id,
                UserId = wallet.UserId,
                Balance = wallet.Balance,
                Currency = wallet.Currency,
                IsActive = wallet.IsActive,
                CreatedAt = wallet.CreatedAt,
                UpdatedAt = wallet.UpdatedAt
            };
        }

        public async Task<WalletDTo?> GetWalletByUserIdAsync(Guid userId)
        {
           var result =  await _walletRepository.GetWalletByUserIdAsync(userId);
            var walletDto =
                 new WalletDTo
                 {
                     Id = result.Id,
                     UserId = result.UserId,
                     Balance = result.Balance,
                     Currency = result.Currency,
                     IsActive = result.IsActive,
                     CreatedAt = result.CreatedAt,
                     UpdatedAt = result.UpdatedAt
                 };

            return walletDto;
        }

        public Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
return _walletRepository.IncreaseWalletBalanceAsync(userId, amount);
        }
    }
}
