using AutoMapper;
using Hangfire;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class PromotionService : IPromotionService
    {
        private readonly ILogger<PromotionService> _logger;
        private readonly IPromotionRepository _promotionRepository;
        private readonly IMapper _mapper;

        public PromotionService(
            ILogger<PromotionService> logger,
            IPromotionRepository promotionRepository,
            IMapper mapper)
        {
            _logger = logger;
            _promotionRepository = promotionRepository;
            _mapper = mapper;
        }

        /// <summary>
        /// Tạo mới promotion
        /// </summary>
        public async Task<PromotionDto> CreatePromotionAsync(PromotionDto promotionDto)
        {
            try
            {
            
                var promotion = _mapper.Map<Promotion>(promotionDto);
                promotion.Id = Guid.NewGuid();
                promotion.CreatedAt = DateTime.UtcNow;
                promotion.UsedCount = 0;
                promotion.IsActive = true;

                // ✅ Create promotion
                var createdPromotion = await _promotionRepository.createPromotionAsync(promotion);
                var Valreturn = _mapper.Map<PromotionDto>(createdPromotion);
                if (promotion.EndDate > DateTime.UtcNow) {
                    Valreturn.IsActive = false;
                    BackgroundJob.Schedule<IPromotionService>(
                             service => service.UpdatePromotionAsync(Valreturn)
                             , createdPromotion.EndDate.AddMinutes(1));

                }
           
                return Valreturn;
            }
            catch (Exception ex)
            {
               
            }
            return null!;
        }

        public async Task<IEnumerable<PromotionDto>> GetAllPromotion()
        {
            try
            {
                var promotions = await _promotionRepository.getAllPromotion();
                if (promotions == null)
                    return Enumerable.Empty<PromotionDto>();

                var dtoList = _mapper.Map<IEnumerable<PromotionDto>>(promotions);

             
   

                return dtoList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all promotions");
                throw;
            }
        }

        /// <summary>
        /// Lấy promotion theo code
        /// </summary>
        public async Task<PromotionDto?> GetPromotionByCodeAsync(string code)
        {
            try
            {
             

                var promotion = await _promotionRepository.GetPromotionByCodeAsync(code);

             

                return _mapper.Map<PromotionDto>(promotion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting promotion by code: {Code}", code);
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra promotion code đã tồn tại chưa
        /// </summary>
        public async Task<bool> PromotionCodeExistsAsync(string code)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(code))
                {
                    return false;
                }

                return await _promotionRepository.PromotionCodeExistsAsync(code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking promotion code existence: {Code}", code);
                throw;
            }
        }

        public async Task<bool> DeletePromotionAsync(Guid id)
        {
            try
            {
                var deleted = await _promotionRepository.DeletePromotionAync(id);
                if (!deleted)
                {
                    _logger.LogWarning("Promotion not found for delete: {Id}", id);
                    return false;
                }
                _logger.LogInformation("Promotion deleted: {Id}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting promotion: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Cập nhật promotion
        /// </summary>
        public async Task<PromotionDto> UpdatePromotionAsync(PromotionDto promotionDto)
        {
            try
            {
                var existingPromotion = await _promotionRepository.GetPromotionByCodeAsync(promotionDto.Code);
                _mapper.Map(promotionDto, existingPromotion);
   
                var updatedPromotion = await _promotionRepository.updatePromotionAsync(existingPromotion);

          

                return _mapper.Map<PromotionDto>(updatedPromotion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating promotion: {Id}", promotionDto.Id);
                throw;
            }
        }
    }
}