using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class PromotionRepository : IPromotionRepository
    {
        private readonly MedixContext _medixContext;

        public PromotionRepository(MedixContext medixContext)
        {
            _medixContext = medixContext;
        }

        public Task<Promotion> createPromotionAsync(Promotion promotion)
        {
           return Task.FromResult(_medixContext.Promotions.Add(promotion).Entity);
        }

        public Task<Promotion?> GetPromotionByCodeAsync(string code)
        {
            return _medixContext.Promotions.FirstOrDefaultAsync(p => p.Code == code);
        }

        public Task<bool> PromotionCodeExistsAsync(string code)
        {
            return _medixContext.Promotions.AnyAsync(p => p.Code == code);
        }

        public Task<Promotion> updatePromotionAsync(Promotion promotion)
        {
           return Task.FromResult(_medixContext.Promotions.Update(promotion).Entity);
        }
    }
}
