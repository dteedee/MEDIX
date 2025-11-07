using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;

namespace Medix.API.Business.Services.Classification
{
    public class PromotionService : IPromotionService
    {
        private readonly ILogger<PromotionService> _logger;
        private readonly IPromotionRepository _promotionRepository;

        private readonly IMapper _mapper;
        public PromotionService(ILogger<PromotionService> logger, IPromotionRepository promotionRepository, IMapper mapper)
        {
            _logger = logger;
            _promotionRepository = promotionRepository;
            _mapper = mapper;
        }
        public Task<PromotionDto> CreatePromotionAsync(PromotionDto promotionDto)
        {
            throw new NotImplementedException();
        }

        public async Task<PromotionDto?> GetPromotionByCodeAsync(string code)
        {
            var promotion = await _promotionRepository.GetPromotionByCodeAsync(code);

            if (promotion == null)
            {
                return null;
            }

            // ✅ Sử dụng AutoMapper
            return _mapper.Map<PromotionDto>(promotion);
        }

        public Task<bool> PromotionCodeExistsAsync(string code)
        {
            throw new NotImplementedException();
        }

        public async Task<PromotionDto> UpdatePromotionAsync(PromotionDto promotionDto)
        {
          
            var existingPromotion = await _promotionRepository.GetPromotionByCodeAsync(promotionDto.Code);

            if (existingPromotion == null)
            {
                throw new InvalidOperationException($"Promotion with Id '{promotionDto.Id}' not found");
            }

           
            if (existingPromotion.Code != promotionDto.Code)
            {
                var isDuplicate = await _promotionRepository.PromotionCodeExistsAsync(promotionDto.Code);
                if (isDuplicate)
                {
                    throw new InvalidOperationException($"Promotion code '{promotionDto.Code}' already exists");
                }
            }

          
            if (promotionDto.StartDate >= promotionDto.EndDate)
            {
                throw new InvalidOperationException("Start date must be before end date");
            }

            if (promotionDto.DiscountValue <= 0)
            {
                throw new InvalidOperationException("Discount value must be greater than 0");
            }

            if (promotionDto.DiscountType == "Percentage" && promotionDto.DiscountValue > 100)
            {
                throw new InvalidOperationException("Percentage discount cannot exceed 100%");
            }

            // Map và update
            _mapper.Map(promotionDto, existingPromotion);
            var updatedPromotion = await _promotionRepository.updatePromotionAsync(existingPromotion);

            return _mapper.Map<PromotionDto>(updatedPromotion);
        }
    }
}
