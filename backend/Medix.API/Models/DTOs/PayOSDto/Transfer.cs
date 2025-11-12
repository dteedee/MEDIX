using PayOS.Models.V1.Payouts;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.PayOSDto
{

    public class Transfer
    {
        [Required]
        public string Id { get; set; } = "";

        public string? PayoutId { get; set; } = "";

        public int? TotalCredit { get; set; }

        public List<string>? Category { get; set; }

        public PayoutApprovalState ApprovalState { get; set; } = PayoutApprovalState.Drafting;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.Now;

        public List<TransferTransactionDToAccountRequest> Transactions { get; set; } = [];
    }


    public class TransferCreateRequest
    {
        [Required]
        public Guid TransferTransactionID { get; set; }= Guid.Empty;
    }


    public class TransferTransactionDToAccountRequest
    {
        [Required]
        public string Id { get; set; } = "";

        public string? PayoutTransactionId { get; set; } = "";

        [Required]
        public long Amount { get; set; }

        [Required]
        public string Description { get; set; } = "";

        [Required]
        public string ToBin { get; set; } = "";

        [Required]
        public string ToAccountNumber { get; set; } = "";

        public string? ToAccountName { get; set; }

        public string? Reference { get; set; }

        public DateTimeOffset? TransactionDatetime { get; set; }

        public string? ErrorMessage { get; set; }

        public string? ErrorCode { get; set; }

        public PayoutTransactionState State { get; set; } = PayoutTransactionState.Received;
    }
}

