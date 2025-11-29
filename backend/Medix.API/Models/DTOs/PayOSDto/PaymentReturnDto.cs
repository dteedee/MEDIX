
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.PayOSDto
{
    public class PaymentReturnDto
    {

        [Required]
        public string Code { get; set; } = string.Empty;
        [Required]
        public string Id { get; set; } = string.Empty;
        public bool Cancel { get; set; } = false;
        [Required]
        public string Status { get; set; } = string.Empty;
        [Required]
        public long OrderCode { get; set; }
        public bool IsSuccessful => Code == "00" && Status == "PAID" && !Cancel;
        public bool IsCancelled => Cancel || Status == "CANCELLED";
        public bool IsFailed => Code != "00" && !Cancel && Status != "PAID";
    }
}