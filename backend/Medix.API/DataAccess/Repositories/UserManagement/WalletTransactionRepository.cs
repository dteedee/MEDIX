using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.Entities;

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
    }
}
