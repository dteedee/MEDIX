using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileUpdateRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
        [MinLength(6, ErrorMessage = "Tên tài khoản phải có ít nhất 6 ký tự")]
        [MaxLength(200, ErrorMessage = "Tên đăng nhập không được vượt quá 200 ký tự")]
        public string UserName { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số")]
        public string PhoneNumber { get; set; } = null!;

        public string? Address { get; set; }
    }
}
