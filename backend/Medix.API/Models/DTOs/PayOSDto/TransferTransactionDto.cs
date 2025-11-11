namespace Medix.API.Models.DTOs.PayOSDto
{
    public class TransferTransactionDto
    {
        public Guid Id { get; set; }
        public long Amount { get; set; }
        public string Description { get; set; } = null!;
        public string ToBin { get; set; } = null!;
        public string ToAccountNumber { get; set; } = null!;
        public string? FromBin { get; set; }
        public string? FromAccountNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = null!;
        public string? ReferenceCode { get; set; }
        public Guid WalletTransactionID { get; set; }
        public Guid UserId { get; set; }
    }

    public class TransferTransactionCreateRequest
    {
        public long Amount { get; set; }
        public string Description { get; set; } = null!;
        public string ToBin { get; set; } = null!;
        public string ToAccountNumber { get; set; } = null!;
        public Guid? UserId { get; set; }
        public Guid? WalletTransactionID { get; set; }
    }
}
