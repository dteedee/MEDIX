using System.ComponentModel.DataAnnotations;
using Medix.API.Business.Validators;

namespace Medix.API.Models.DTOs
{
    public class RegisterRequestPatientDTO
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        [PasswordComplexityAttribute]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc")]
        [Compare("Password", ErrorMessage = "Mật khẩu và xác nhận không khớp")]
        public string PasswordConfirmation { get; set; } = null!;

        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [MinLength(2, ErrorMessage = "Họ tên phải có ít nhất 2 ký tự")]
        [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = null!;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? PhoneNumber { get; set; }

        [DataType(DataType.Date, ErrorMessage = "Ngày sinh không hợp lệ")]
        public DateOnly? DateOfBirth { get; set; }

        [MaxLength(20, ErrorMessage = "Số CMND/CCCD không được vượt quá 20 ký tự")]
        public string? IdentificationNumber { get; set; }

        [MaxLength(10, ErrorMessage = "Mã giới tính không được vượt quá 10 ký tự")]
        [GenderCodeValidationAttribute]
        public string? GenderCode { get; set; }
    }
}
