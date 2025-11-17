using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IUserPromotionRepository
    {
        Task<UserPromotion> CreateAsync(UserPromotion userPromotion);
        Task<UserPromotion?> GetByIdAsync(Guid id);
        Task<UserPromotion?> GetByUserIdAndPromotionIdAsync(Guid userId, Guid promotionId);
        Task<IEnumerable<UserPromotion>> GetByUserIdAsync(Guid userId);
        Task<IEnumerable<UserPromotion>> GetActiveByUserIdAsync(Guid userId);
        Task<UserPromotion?> UpdateAsync(UserPromotion userPromotion);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> DeleteByUserIdAsync(Guid userId);
        Task<bool> IsPromotionAssignedToUserAsync(Guid userId, Guid promotionId);
        Task<int> IncrementUsageCountAsync(Guid id);
    }
}
