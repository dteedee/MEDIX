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

        // Phương thức này của bạn đã đúng, giữ nguyên
        public async Task<Wallet> CreateWalletAsync(Wallet wallet)
        {
            await _context.Wallets.AddAsync(wallet);
            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task<bool> DecreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
            // 1. Dùng FirstOrDefaultAsync và await
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            // 2. Thêm kiểm tra null (RẤT QUAN TRỌNG)
            if (wallet == null)
            {
                return false; // Không tìm thấy ví, không thể giảm tiền
            }

            wallet.Balance -= amount;
            _context.Wallets.Update(wallet);

            // 3. Phải await SaveChangesAsync và kiểm tra kết quả
            int recordsAffected = await _context.SaveChangesAsync();
            return recordsAffected > 0;
        }

        public async Task<bool> DeleteWalletBalanceAsync(Guid userId, decimal amount)
        {
            // Bạn chưa implement phương thức này
            throw new NotImplementedException();
        }

        public async Task<decimal> GetWalletBalanceAsync(Guid userId)
        {
            // 1. Dùng FirstOrDefaultAsync và await
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            // 2. Kiểm tra null, nếu không tìm thấy ví thì trả về 0
            if (wallet == null)
            {
                return 0; // Hoặc ném ra một Exception tùy theo logic nghiệp vụ
            }

            // 3. Trả về Balance trực tiếp
            return wallet.Balance;
        }

        public async Task<Wallet> GetWalletByIdAsync(Guid walletId)
        {
            // 1. Thêm async, await và dùng FirstOrDefaultAsync
            // 2. Không cần Task.FromResult
            return await _context.Wallets.FirstOrDefaultAsync(w => w.Id == walletId);
        }

        public async Task<Wallet> GetWalletByUserIdAsync(Guid userId)
        {
            // 1. Thêm async, await và dùng FirstOrDefaultAsync
            // 2. Không cần Task.FromResult
            return await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId && w.IsActive == true);
        }

        public async Task<bool> IncreaseWalletBalanceAsync(Guid userId, decimal amount)
        {
            // 1. Dùng FirstOrDefaultAsync và await
            var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);

            // 2. Thêm kiểm tra null (RẤT QUAN TRỌNG)
            if (wallet == null)
            {
                return false; // Không tìm thấy ví, không thể tăng tiền
            }

            wallet.Balance += amount;
            _context.Wallets.Update(wallet);

            // 3. Phải await SaveChangesAsync và kiểm tra kết quả
            int recordsAffected = await _context.SaveChangesAsync();
            return recordsAffected > 0;
        }
    }
}