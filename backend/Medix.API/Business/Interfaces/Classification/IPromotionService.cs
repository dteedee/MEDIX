using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IPromotionService
    {
        public Task<bool> PromotionCodeExistsAsync(string code);

        public Task<PromotionDto?> GetPromotionByCodeAsync(string code);

        public Task<PromotionDto> CreatePromotionAsync(PromotionDto promotionDto);
        public Task<PromotionDto> UpdatePromotionAsync(PromotionDto promotionDto);
        public Task<IEnumerable<PromotionDto>> GetAllPromotion();

        public Task<bool> DeletePromotionAsync(Guid id);

        public Task<IEnumerable<PromotionDto>> GetPromotionforTypeTarget(string type);

    }
}
