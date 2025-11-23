using Hangfire;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Business.Services.Classification
{
    public class UserPromotionService : IUserPromotionService
    {
        private readonly IUserPromotionRepository _userPromotionRepository;
        private readonly IUserRepository userRepository;

        public UserPromotionService(IUserPromotionRepository userPromotionRepository, IUserRepository userRepository)
        {
            _userPromotionRepository = userPromotionRepository;
            this.userRepository = userRepository;
        }

        public async Task<UserPromotionDto> AssignPromotionToUserAsync(Guid userId, Guid promotionId)
        {
            // Kiểm tra xem promotion đã được gán cho user chưa
      

      

            var userPromotion = new UserPromotion
            {
                UserId = userId,
                PromotionId = promotionId,
                UsedCount = 0,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddDays(30)  // ✅ Set ExpiryDate từ Promotion
            };

            var created = await _userPromotionRepository.CreateAsync(userPromotion);

            // Load promotion details
            var result = await _userPromotionRepository.GetByIdAsync(created.Id);

            // ✅ Schedule job để tự động deactivate khi hết hạn
            if (result != null && result.ExpiryDate > DateTime.UtcNow)
            {
                BackgroundJob.Schedule<IUserPromotionService>(
                    service => service.DeactivatePromotionAsync(result.Id),
                    result.ExpiryDate.AddSeconds(30));
            }

            return MapToDto(result!);
        }



        public async Task<UserPromotionDto?> GetUserPromotionByIdAsync(Guid id)
        {
            var userPromotion = await _userPromotionRepository.GetByIdAsync(id);

            if (userPromotion == null)
                return null;

            return MapToDto(userPromotion);
        }

        public async Task<IEnumerable<UserPromotionDto>> GetUserPromotionsByUserIdAsync(Guid userId)
        {
            var userPromotions = await _userPromotionRepository.GetByUserIdAsync(userId);

            return userPromotions.Select(MapToDto);
        }

        public async Task<IEnumerable<UserPromotionDto>> GetActiveUserPromotionsAsync(Guid userId)
        {
            var activePromotions = await _userPromotionRepository.GetActiveByUserIdAsync(userId);

            return activePromotions.Select(MapToDto);
        }

        public async Task<UserPromotionDto?> UsePromotionAsync(Guid id)
        {
            var userPromotion = await _userPromotionRepository.GetByIdAsync(id);

            if (userPromotion == null)
                return null;

            var now = DateTime.UtcNow;

            // Validate promotion
            if (!userPromotion.IsActive)
                throw new InvalidOperationException("This promotion is not active.");

            if (!userPromotion.Promotion.IsActive)
                throw new InvalidOperationException("The promotion has been deactivated.");

            if (userPromotion.Promotion.StartDate > now)
                throw new InvalidOperationException("This promotion has not started yet.");

            if (userPromotion.Promotion.EndDate < now)
                throw new InvalidOperationException("This promotion has expired.");

            if (userPromotion.Promotion.MaxUsage.HasValue &&
                userPromotion.UsedCount >= userPromotion.Promotion.MaxUsage.Value)
                throw new InvalidOperationException("Usage limit reached for this promotion.");

            // Increment usage count
            await _userPromotionRepository.IncrementUsageCountAsync(id);

            // Reload to get updated data
            var updated = await _userPromotionRepository.GetByIdAsync(id);

            return MapToDto(updated!);
        }

        public async Task<bool> DeactivatePromotionAsync(Guid id)
        {
            var userPromotion = await _userPromotionRepository.GetByIdAsync(id);

            if (userPromotion == null)
                return false;

            userPromotion.IsActive = false;
            await _userPromotionRepository.UpdateAsync(userPromotion);

            return true;
        }

        public async Task<bool> IsPromotionValidForUserAsync(Guid userId, Guid promotionId)
        {
            var userPromotion = await _userPromotionRepository.GetByUserIdAndPromotionIdAsync(userId, promotionId);

            if (userPromotion == null || !userPromotion.IsActive)
                return false;

            var now = DateTime.UtcNow;
            var promotion = userPromotion.Promotion;

            return promotion.IsActive
                && promotion.StartDate <= now
                && promotion.EndDate >= now
                && (!promotion.MaxUsage.HasValue || userPromotion.UsedCount < promotion.MaxUsage.Value);
        }

        private UserPromotionDto MapToDto(UserPromotion userPromotion)
        {
            return new UserPromotionDto
            {
                Id = userPromotion.Id,
                UserId = userPromotion.UserId,
                PromotionId = userPromotion.PromotionId,
                UsedCount = userPromotion.UsedCount,
                IsActive = userPromotion.IsActive,
                AssignedAt = userPromotion.AssignedAt,
                LastUsedAt = userPromotion.LastUsedAt,
                ExpiryDate = userPromotion.ExpiryDate,
                Promotion = userPromotion.Promotion != null ? new PromotionDto
                {
                    Id = userPromotion.Promotion.Id,
                    Code = userPromotion.Promotion.Code,
                    Name = userPromotion.Promotion.Name,
                    Description = userPromotion.Promotion.Description,
                    DiscountType = userPromotion.Promotion.DiscountType,
                    DiscountValue = userPromotion.Promotion.DiscountValue,
                    MaxUsage = userPromotion.Promotion.MaxUsage,
                    UsedCount = userPromotion.Promotion.UsedCount,
                    StartDate = userPromotion.Promotion.StartDate,
                    EndDate = userPromotion.Promotion.EndDate,
                    IsActive = userPromotion.Promotion.IsActive,
                    CreatedAt = userPromotion.Promotion.CreatedAt,
                    // map new field
                    ApplicableTargets = userPromotion.Promotion.ApplicableTargets
                } : null
            };
        }

        public async Task<IEnumerable<UserPromotionDto>> AssignPromotionToMultipleUsersAsync(
               Guid promotionId,
               bool applicableToAllUsers,
               bool applicableToNewUsers,
               bool applicableToVipUsers,
               int newUserDays = 30)
        {
            if (!applicableToAllUsers && !applicableToNewUsers && !applicableToVipUsers)
                throw new InvalidOperationException("At least one target flag must be true.");

            // Load all users once (includes roles)
            var allUsers = (await userRepository.GetAllAsync()).ToList();

            IEnumerable<User> targets;

            if (applicableToAllUsers)
            {
                targets = allUsers;
            }
            else
            {
                var set = new Dictionary<Guid, User>();

                if (applicableToNewUsers)
                {
                    var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, newUserDays));
                    foreach (var u in allUsers.Where(u => u.CreatedAt >= cutoff))
                        set[u.Id] = u;
                }

                if (applicableToVipUsers)
                {
                    foreach (var u in allUsers.Where(u =>
                        u.UserRoles != null &&
                        u.UserRoles.Any(ur =>
                            (ur.RoleCodeNavigation != null &&
                             (string.Equals(ur.RoleCodeNavigation.Code, "VIP", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(ur.RoleCodeNavigation.DisplayName, "VIP", StringComparison.OrdinalIgnoreCase)))
                        )))
                    {
                        set[u.Id] = u;
                    }
                }
                 
                targets = set.Values;
            }

            var createdDtos = new List<UserPromotionDto>();

            foreach (var user in targets)
            {
                // Skip if already assigned
                var exists = await _userPromotionRepository.GetByUserIdAndPromotionIdAsync(user.Id, promotionId);
                if (exists != null) continue;

                var userPromotion = new UserPromotion
                {
                    UserId = user.Id,
                    PromotionId = promotionId,
                    UsedCount = 0,
                    IsActive = true,
                    AssignedAt = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddDays(30) // fallback; ideally read from Promotion
                };

                var created = await _userPromotionRepository.CreateAsync(userPromotion);
                var loaded = await _userPromotionRepository.GetByIdAsync(created.Id);

                if (loaded != null)
                {
                    // Schedule deactivation
                    if (loaded.ExpiryDate > DateTime.UtcNow)
                    {
                        BackgroundJob.Schedule<IUserPromotionService>(
                            svc => svc.DeactivatePromotionAsync(loaded.Id),
                            loaded.ExpiryDate.AddSeconds(30));
                    }

                    createdDtos.Add(MapToDto(loaded));
                }
            }

            return createdDtos;
        }
    }
}