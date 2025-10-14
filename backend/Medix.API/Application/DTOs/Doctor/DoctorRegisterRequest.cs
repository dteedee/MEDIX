using Medix.API.Application.ValidationAttributes;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Application.DTOs.Doctor
{
    public class DoctorRegisterRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
        [MaxLength(200, ErrorMessage = "Họ và tên không được vượt quá 200 ký tự")]
        public string FullName { get; set; } = null!;
        public string? Dob { get; set; }
        public string? GenderCode { get; set; }
        [Required(ErrorMessage = "Vui lòng nhập số CCCD/CMND")]
        [MaxLength(50, ErrorMessage = "Số CCCD/CMND không được vượt quá 50 ký tự")]
        public string IdentificationNumber { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập email")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;
        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
        public string PhoneNumber { get; set; } = null!;
        public string Password { get; set; } = null!;

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
        public int YearsOfExperience { get; set; } = 0;
    }
}
