using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class PromotionRepository : IPromotionRepository
    {
        private readonly MedixContext _context;

        public PromotionRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<bool> PromotionCodeExistsAsync(string code)
        {
            return await _context.Promotions
                .AnyAsync(p => p.Code == code);
        }
        public async Task<Promotion?> GetPromotionByCodeAsync(string code)
        {
            return await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code == code);
        }

        public async Task<Promotion> createPromotionAsync(Promotion promotion)
        {
            await _context.Promotions.AddAsync(promotion);
            await _context.SaveChangesAsync();
            return promotion;
        }



        public async Task<Promotion> updatePromotionAsync(Promotion promotion)
        {
            _context.Promotions.Update(promotion);
            await _context.SaveChangesAsync();
            return promotion;
        }
    }

}
