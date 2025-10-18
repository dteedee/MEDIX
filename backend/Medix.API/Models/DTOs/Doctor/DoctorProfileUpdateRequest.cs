using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileUpdateRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
        [MaxLength(200, ErrorMessage = "Họ và tên không được vượt quá 200 ký tự")]
        public string FullName { get; set; } = null!;

        [Dob]
        public string? Dob { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số")]
        public string PhoneNumber { get; set; } = null!;

        [MaxLength(500, ErrorMessage = "Địa chỉ không được vượt quá 500 ký tự")]
        public string? Address { get; set; }

        [MaxLength(1000, ErrorMessage = "Tiểu sử không được vượt quá 1000 ký tự")]
        public string? Bio { get; set; }

        [MaxLength(1000, ErrorMessage = "Học vấn không được vượt quá 1000 ký tự")]
        public string? Education { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập số năm kinh nghiệm")]
        [Range(1, 50, ErrorMessage = "Số năm kinh nghiệm không hợp lệ")]
        public int? YearsOfExperience { get; set; } = 0;

        [Range(0, 1000000, ErrorMessage = "Phí tư vấn không hợp lệ")]
        public decimal? ConsultationFee { get; set; } = 0;
    }
}
