using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.Models.DTOs.Wallet
{
    public class WalletTransactionDto
    {
      public  Guid? id { get; set; }
        public  Guid? walletId { get; set; }
        public long? orderCode { get; set; }
        public string? TransactionTypeCode { get; set; } = null!;
        public decimal? Amount { get; set; }
        public decimal? BalanceBefore { get; set; }
        public decimal BalanceAfter { get; set; }
        public string? Status { get; set; } = null!;
        public Guid? RelatedAppointmentId { get; set; }
        public string? Description { get; set; }
        public DateTime? TransactionDate { get; set; }
        public DateTime? CreatedAt { get; set; }

    }
}