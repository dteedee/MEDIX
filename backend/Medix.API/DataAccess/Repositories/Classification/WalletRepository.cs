using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class WalletRepository : IWalletRepository
    {
        private readonly MedixContext _context;

        public WalletRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<Wallet> CreateWalletAsync(Wallet wallet)
        {
            await _context.Wallets.AddAsync(wallet);
            await _context.SaveChangesAsync();
            return wallet;
        }
        public Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
            var wallet = _context.Wallets.FirstOrDefault(w => w.UserId == userId);
          
            wallet.Balance -= amount;
            _context.Wallets.Update(wallet);
            _context.SaveChangesAsync();
            return Task.FromResult(true);
        }

        public Task<bool> DeleteWalletBalanceAsync(Guid userId, decimal amount)
        {
            throw new NotImplementedException();
        }

        public Task<decimal> GetWalletBalanceAsync(Guid userId)
        {
          return Task.FromResult(_context.Wallets.FirstOrDefault(w => w.UserId == userId).Balance);
        }

        public Task<Wallet> GetWalletByUserIdAsync(Guid userId)
        {
            return Task.FromResult(_context.Wallets.FirstOrDefault(w => w.UserId == userId&& w.IsActive==true));
        }

        public Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
           var wallet = _context.Wallets.FirstOrDefault(w => w.UserId == userId);
          
            wallet.Balance += amount;
            _context.Wallets.Update(wallet);
            _context.SaveChangesAsync();
            return Task.FromResult(true);
        }
    }
}
