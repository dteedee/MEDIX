using VNPAY.NET.Enums;

namespace VNPAY.NET.Models
{
    public class PaymentRequest
    {

        public required long PaymentId { get; set; }
        public required string Description { get; set; }
        public required double Money { get; set; }
        public required string IpAddress { get; set; }
        public BankCode BankCode { get; set; } = BankCode.ANY;
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public Currency Currency { get; set; } = Currency.VND;
        public DisplayLanguage Language { get; set; } = DisplayLanguage.Vietnamese;
    }
}
