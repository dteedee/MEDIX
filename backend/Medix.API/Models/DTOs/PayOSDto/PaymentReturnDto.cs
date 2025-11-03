
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.PayOSDto
{
    public class PaymentReturnDto
    {
        /// <summary>
        /// Mã ph?n h?i t? PayOS (00 = thành công)
        /// </summary>
        [Required]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// ID giao d?ch t? PayOS
        /// </summary>
        [Required]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Tr?ng thái h?y b? giao d?ch
        /// </summary>
        public bool Cancel { get; set; } = false;

        /// <summary>
        /// Tr?ng thái thanh toán (PAID, CANCELLED, PENDING, etc.)
        /// </summary>
        [Required]
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Mã ??n hàng
        /// </summary>
        [Required]
        public long OrderCode { get; set; }

        /// <summary>
        /// Ki?m tra xem thanh toán có thành công không
        /// </summary>
        public bool IsSuccessful => Code == "00" && Status == "PAID" && !Cancel;

        /// <summary>
        /// Ki?m tra xem thanh toán có b? h?y không
        /// </summary>
        public bool IsCancelled => Cancel || Status == "CANCELLED";

        /// <summary>
        /// Ki?m tra xem thanh toán có th?t b?i không
        /// </summary>
        public bool IsFailed => Code != "00" && !Cancel && Status != "PAID";
    }
}