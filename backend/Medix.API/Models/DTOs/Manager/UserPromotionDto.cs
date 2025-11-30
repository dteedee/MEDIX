using Medix.API.Models.Entities;

namespace Medix.API.Models.DTOs.Manager
{
    public class UserPromotionDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid PromotionId { get; set; }
        public int UsedCount { get; set; } = 0;
        public DateTime ExpiryDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime AssignedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }

        public PromotionDto? Promotion { get; set; }


        public bool IsExpired => DateTime.UtcNow > ExpiryDate;
        public bool IsValidNow => IsActive && !IsExpired;
    }


    public class BulkAssignPromotionRequest
    {
        public Guid PromotionId { get; set; }
        public bool ApplicableToAllUsers { get; set; } = false;
        public bool ApplicableToNewUsers { get; set; } = false;
        public bool ApplicableToVipUsers { get; set; } = false;

        public int? NewUserDays { get; set; } = 30;
    }
}


