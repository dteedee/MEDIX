using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IUserPromotionService
    {
        Task<UserPromotionDto> AssignPromotionToUserAsync(Guid userId, Guid promotionId);
        Task<UserPromotionDto?> GetUserPromotionByIdAsync(Guid id);
        Task<IEnumerable<UserPromotionDto>> GetUserPromotionsByUserIdAsync(Guid userId);
        Task<IEnumerable<UserPromotionDto>> GetActiveUserPromotionsAsync(Guid userId);
        Task<UserPromotionDto?> UsePromotionAsync(Guid id);
        Task<bool> DeactivatePromotionAsync(Guid id);
        Task<bool> IsPromotionValidForUserAsync(Guid userId, Guid promotionId);
    }
}
