using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs
{
    public class UserUpdateDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [MinLength(2, ErrorMessage = "Họ tên phải có ít nhất 2 ký tự")]
        [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? PhoneNumber { get; set; }

        [MaxLength(10, ErrorMessage = "Mã giới tính không được vượt quá 10 ký tự")]
        public string? GenderCode { get; set; }

        [MaxLength(20, ErrorMessage = "Số CMND/CCCD không được vượt quá 20 ký tự")]
        public string? IdentificationNumber { get; set; }

        [MaxLength(500, ErrorMessage = "Địa chỉ không được vượt quá 500 ký tự")]
        public string? Address { get; set; }
    }
}
