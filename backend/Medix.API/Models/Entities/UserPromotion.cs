namespace Medix.API.Models.Entities
{
    public partial class UserPromotion
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid PromotionId { get; set; }
        public int UsedCount { get; set; } = 0;

        public DateTime ExpiryDate { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime AssignedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }

        // Navigation properties
        public virtual Promotion Promotion { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }   
}
