namespace Medix.API.Models.Entities
{
    public partial class TransferTransaction
    {
        public Guid Id { get; set; }

        public long Amount { get; set; }

        public string Description { get; set; } = null!;

        public string ToBin { get; set; } = null!;

        public string ToAccountNumber { get; set; } = null!;

        public string? FromBin { get; set; }

        public string? FromAccountNumber { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Pending";

        public string? ReferenceCode { get; set; }

        // Foreign key for one-to-one relationship with WalletTransaction
        public Guid? WalletTransactionId { get; set; }

        // Foreign key for many-to-one relationship with User
        public Guid UserId { get; set; }

        public Guid WalletTransactionID { get;set; }

    }
}
