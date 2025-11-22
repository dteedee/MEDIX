using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IPromotionRepository
    { 
        public Task<bool> PromotionCodeExistsAsync(string code);
        public Task<Promotion?> GetPromotionByCodeAsync(string code);
        public Task<Promotion> updatePromotionAsync(Promotion promotion);
        public Task<Promotion> createPromotionAsync(Promotion promotion);
        public Task<IEnumerable<Promotion>> getAllPromotion();
        public Task<bool> DeletePromotionAync(Guid id);
    }
}
