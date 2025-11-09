using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.UserManagement
{
    public class WalletTransactionRepository : IWalletTransactionRepository
    {
        private readonly MedixContext _context;

        public WalletTransactionRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<WalletTransaction> CreateWalletTransactionAsync(WalletTransaction walletTransaction)
        {
            await _context.WalletTransactions.AddAsync(walletTransaction);
            await _context.SaveChangesAsync();
            return walletTransaction;
        }

        public async Task<List<WalletTransaction>> GetTransactionsByWalletIdAsync(Guid walletId)
        {
         return await  _context.WalletTransactions
                .Where(x => x.WalletId == walletId)
                .OrderByDescending(x => x.TransactionDate)
                .ToListAsync();
        }

        public async Task<WalletTransaction?> GetWalletTransactionByOrderCodeAsync(long orderCode)
        {
            return await _context.WalletTransactions
                .Where(x => x.OrderCode == orderCode && x.Status == "Pending")
                .FirstOrDefaultAsync();
        }

        public async Task<WalletTransaction?> UpdateWalletTransactionAsync(WalletTransaction walletTransaction)
        {
            _context.WalletTransactions.Update(walletTransaction);
            await _context.SaveChangesAsync();
            return walletTransaction;
        }
    }
}
