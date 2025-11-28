using VNPAY.NET.Enums;

namespace VNPAY.NET.Models
{
    public class PaymentResponse
    {
        public ResponseCode Code { get; set; }
        public string Description { get; set; }
    }
}
