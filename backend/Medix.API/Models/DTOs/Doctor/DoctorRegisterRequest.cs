using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Application.DTOs.Doctor
{
    public class DoctorRegisterRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
        [MaxLength(200, ErrorMessage = "Họ và tên không được vượt quá 200 ký tự")]
        public string FullName { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập")]
        [MaxLength(256, ErrorMessage = "Tên đăng nhập không được vượt quá 256 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9]+$", ErrorMessage = "Tên đăng nhập chỉ được chứa chữ cái không dấu và số")]
        public string UserName { get; set; } = null!;
        [Dob]
        public string? Dob { get; set; }
        public string? GenderCode { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập số CCCD")]
        [RegularExpression(@"^\d{12}$", ErrorMessage = "Số CCCD phải gồm đúng 12 chữ số")]
        public string IdentificationNumber { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập email")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số")]
        public string PhoneNumber { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng chọn chuyên khoa")]
        public string SpecializationId { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập số giấy phép hành nghề")]
        public string LicenseNumber { get; set; } = null!;
        [ImageFile]
        public IFormFile? LicenseImage { get; set; }
        [MaxLength(1000, ErrorMessage = "Tiểu sử không được vượt quá 1000 ký tự")]
        public string? Bio { get; set; }
        [MaxLength(1000, ErrorMessage = "Học vấn không được vượt quá 1000 ký tự")]
        public string? Education { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập số năm kinh nghiệm")]
        [Range(1, 50, ErrorMessage = "Số năm kinh nghiệm không hợp lệ")]
        public int? YearsOfExperience { get; set; } = 0;
    }
}