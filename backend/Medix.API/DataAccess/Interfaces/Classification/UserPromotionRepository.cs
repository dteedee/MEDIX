using Medix.API.Models.DTOs.Manager;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public class UserPromotionRepository : IUserPromotionRepository
    {
        private readonly MedixContext _context;

        public UserPromotionRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<UserPromotion> CreateAsync(UserPromotion userPromotion)
        {
            userPromotion.AssignedAt = DateTime.UtcNow;
            userPromotion.IsActive = true;
            userPromotion.UsedCount = 0;

            await _context.UserPromotions.AddAsync(userPromotion);
            await _context.SaveChangesAsync();
            
            return userPromotion;
        }

        public async Task<UserPromotion?> GetByIdAsync(Guid id)
        {
            return await _context.UserPromotions
                .Include(up => up.User)
                .Include(up => up.Promotion)
                .FirstOrDefaultAsync(up => up.Id == id);
        }

        public async Task<UserPromotion?> GetByUserIdAndPromotionIdAsync(Guid userId, Guid promotionId)
        {
            return await _context.UserPromotions
                .Include(up => up.Promotion)
                .FirstOrDefaultAsync(up => up.UserId == userId && up.PromotionId == promotionId);
        }

        public async Task<IEnumerable<UserPromotion>> GetByUserIdAsync(Guid userId)
        {
            return await _context.UserPromotions
                .Include(up => up.Promotion)
                .Where(up => up.UserId == userId)
                .OrderByDescending(up => up.AssignedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<UserPromotion>> GetActiveByUserIdAsync(Guid userId)
        {
            var now = DateTime.UtcNow;

            return await _context.UserPromotions
                .Include(up => up.Promotion)
                .Where(up => up.UserId == userId
                    && up.IsActive
                    && up.ExpiryDate > now  
                    && up.Promotion.IsActive
                    && up.Promotion.StartDate <= now
                    && up.Promotion.EndDate >= now
                    && (up.Promotion.MaxUsage == null || up.UsedCount < up.Promotion.MaxUsage))
                .OrderByDescending(up => up.AssignedAt)
                .ToListAsync();
        }

        public async Task<UserPromotion?> UpdateAsync(UserPromotion userPromotion)
        {
            var existingPromotion = await _context.UserPromotions
                .FirstOrDefaultAsync(up => up.Id == userPromotion.Id);

            if (existingPromotion == null)
                return null;

            existingPromotion.PromotionId = userPromotion.PromotionId;
            existingPromotion.UsedCount = userPromotion.UsedCount;
            existingPromotion.IsActive = userPromotion.IsActive;
            existingPromotion.LastUsedAt = userPromotion.LastUsedAt;

            _context.UserPromotions.Update(existingPromotion);
            await _context.SaveChangesAsync();

            return existingPromotion;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var userPromotion = await _context.UserPromotions.FindAsync(id);
            
            if (userPromotion == null)
                return false;

            _context.UserPromotions.Remove(userPromotion);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteByUserIdAsync(Guid userId)
        {
            var userPromotions = await _context.UserPromotions
                .Where(up => up.UserId == userId)
                .ToListAsync();

            if (!userPromotions.Any())
                return false;

            _context.UserPromotions.RemoveRange(userPromotions);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> IsPromotionAssignedToUserAsync(Guid userId, Guid promotionId)
        {
            return await _context.UserPromotions
                .AnyAsync(up => up.UserId == userId && up.PromotionId == promotionId);
        }

        public async Task<int> IncrementUsageCountAsync(Guid id)
        {
            var userPromotion = await _context.UserPromotions.FindAsync(id);
            
            if (userPromotion == null)
                return 0;

            userPromotion.UsedCount++;
            userPromotion.LastUsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            return userPromotion.UsedCount;
        }

        public Task<IEnumerable<UserPromotionDto>> AssignPromotionToMultipleUsersAsync(Guid promotionId, bool applicableToAllUsers, bool applicableToNewUsers, bool applicableToVipUsers, int newUserDays = 30)
        {
            throw new NotImplementedException();
        }
    }
}