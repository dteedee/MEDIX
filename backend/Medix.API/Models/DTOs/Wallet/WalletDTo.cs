namespace Medix.API.Models.DTOs.Wallet
{
    public class WalletDTo
    {
        public Guid? Id { get; set; }
        public Guid UserId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
   public decimal? consulationFee { get; set; }
        public decimal? CommissionRate { get; set; }
    }
}

