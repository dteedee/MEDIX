using VNPAY.NET.Enums;

namespace VNPAY.NET.Models
{
    public class TransactionStatus
    {
        public TransactionStatusCode Code { get; set; }
        public string Description { get; set; }
    }
}
