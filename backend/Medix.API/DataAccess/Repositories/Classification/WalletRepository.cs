using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

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

        public async Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
            {
                return false; 
            }

            wallet.Balance -= amount;
            _context.Wallets.Update(wallet);

            int recordsAffected = await _context.SaveChangesAsync();
            return recordsAffected > 0;
        }

        public async Task<bool> DeleteWalletBalanceAsync(Guid userId, decimal amount)
        {
            throw new NotImplementedException();
        }

        public async Task<decimal> GetWalletBalanceAsync(Guid userId)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
            {
                return 0; 
            }

            return wallet.Balance;
        }

        public async Task<Wallet> GetWalletByIdAsync(Guid walletId)
        {

            return await _context.Wallets.FirstOrDefaultAsync(w => w.Id == walletId);
        }

        public async Task<Wallet> GetWalletByUserIdAsync(Guid userId)
        {

            return await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId && w.IsActive == true);
        }

        public async Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
            {
                return false; 
            }

            wallet.Balance += amount;
            _context.Wallets.Update(wallet);

            int recordsAffected = await _context.SaveChangesAsync();
            return recordsAffected > 0;
        }
    }
}