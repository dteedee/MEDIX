using PayOS.Models.V2.PaymentRequests;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.PayOSDto
{
    public class Order
    {
        public int Id { get; set; }

        public long OrderCode { get; set; }

        [Required]
        public long TotalAmount { get; set; }

        // Basic order information
        public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.Now;
        public string? Description { get; set; }

        // Payment link related properties
        public string? PaymentLinkId { get; set; }
        public string? QrCode { get; set; }
        public string? CheckoutUrl { get; set; }
        public PaymentLinkStatus Status { get; set; } = PaymentLinkStatus.Pending;

        // Amount tracking
        public long Amount { get; set; }
        public long AmountPaid { get; set; } = 0;
        public long AmountRemaining { get; set; } = 0;

        // Buyer information
        public string? BuyerName { get; set; }
        public string? BuyerCompanyName { get; set; }
        public string? BuyerEmail { get; set; }
        public string? BuyerPhone { get; set; }
        public string? BuyerAddress { get; set; }

        // Payment link details
        public string? Bin { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
        public string? Currency { get; set; } = "VND";

        // URLs
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }

        // Timestamps
        public DateTimeOffset? CreatedAt { get; set; }
        public DateTimeOffset? CanceledAt { get; set; }
        public DateTimeOffset? ExpiredAt { get; set; }
        public DateTimeOffset? LastTransactionUpdate { get; set; }

        // Cancellation
        public string? CancellationReason { get; set; }

        // Invoice settings
        public bool? BuyerNotGetInvoice { get; set; }
        public TaxPercentage? TaxPercentage { get; set; }

        public string? baseURLFE { get; set; }

        [Required]
        public List<OrderItem> Items { get; set; } = [];
    }

    public class OrderItem
    {
        [Required]
        public string? Name { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Required]
        public long Price { get; set; }

        public string? Unit { get; set; }
        public TaxPercentage? TaxPercentage { get; set; }
    }


    public class OrderCreateRequest
    {
        [Required]
        public long TotalAmount { get; set; }

        public string? Description { get; set; }

        public string? ReturnUrl { get; set; }

        public string? CancelUrl { get; set; }

        public string? BuyerName { get; set; }

        public string? BuyerCompanyName { get; set; }

        public string? BuyerEmail { get; set; }

        public string? BuyerPhone { get; set; }

        public string? BuyerAddress { get; set; }

        public DateTimeOffset? ExpiredAt { get; set; }

        public bool? BuyerNotGetInvoice { get; set; }

        public TaxPercentage? TaxPercentage { get; set; }
        public string? baseURLFE { get; set; }

   
        public List<OrderItemCreateRequest>? Items { get; set; } = [];
    }

    public class OrderItemCreateRequest
    {
        [Required]
        public string? Name { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Required]
        public long Price { get; set; }

        public string? Unit { get; set; }

        public TaxPercentage? TaxPercentage { get; set; }
    }


    public class OrderTransaction
    {
        public int Id { get; set; }

        // Reference fields
        public int OrderId { get; set; }
        public long OrderCode { get; set; }
        public string PaymentLinkId { get; set; } = "";

        // Transaction details
        public string Reference { get; set; } = "";
        public long Amount { get; set; }
        public string AccountNumber { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTimeOffset TransactionDateTime { get; set; }
        public string? VirtualAccountName { get; set; }
        public string? VirtualAccountNumber { get; set; }
        public string? CounterAccountBankId { get; set; }
        public string? CounterAccountBankName { get; set; }
        public string? CounterAccountName { get; set; }
        public string? CounterAccountNumber { get; set; }
    }


}
