using Medix.API.Models.Entities;

namespace Medix.API.Models.DTOs
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

        // Promotion details (from navigation property)
        public PromotionDto? Promotion { get; set; }


        // Computed properties
        public bool IsExpired => DateTime.UtcNow > ExpiryDate;
        public bool IsValidNow => IsActive && !IsExpired;
    }
}


//public Guid Id { get; set; }
//public Guid UserId { get; set; }
//public string PromotionCode { get; set; } = null!;
//public string? Description { get; set; }
//public decimal DiscountAmount { get; set; }
//public decimal? DiscountPercentage { get; set; }
//public decimal? MaxDiscountAmount { get; set; }
//public decimal? MinOrderAmount { get; set; }
//public DateTime? StartDate { get; set; }
//public DateTime? ExpiryDate { get; set; }
//public int? UsageLimit { get; set; }
//public int UsedCount { get; set; } = 0;
//public bool IsActive { get; set; } = true;
//public DateTime CreatedAt { get; set; }
//public DateTime? UpdatedAt { get; set; }

//// Navigation properties
//public virtual Promotion Promotion { get; set; }
//public virtual User User { get; set; } = null!;
//    }