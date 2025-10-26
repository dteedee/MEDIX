using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Medix.API.Business.Validators
{
    public class VietnamesePhoneNumberAttribute : ValidationAttribute
    {
        public VietnamesePhoneNumberAttribute()
        {
            // Thiết lập một thông báo lỗi mặc định
            ErrorMessage = "Số điện thoại không hợp lệ. Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0.";
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            // Nếu giá trị là null hoặc rỗng, hãy coi là hợp lệ.
            // Dùng [Required] nếu bạn muốn bắt buộc phải nhập.
            if (value == null || string.IsNullOrEmpty(value.ToString()))
            {
                return ValidationResult.Success;
            }

            string phoneNumber = value.ToString();

            // Sử dụng Regex để kiểm tra
            // ^   : Bắt đầu chuỗi
            // 0   : Ký tự '0'
            // \d  : Bất kỳ chữ số nào (tương đương [0-9])
            // {9} : Lặp lại 9 lần
            // $   : Kết thúc chuỗi
            string pattern = @"^0\d{9}$";

            if (Regex.IsMatch(phoneNumber, pattern))
            {
                // Hợp lệ
                return ValidationResult.Success;
            }
            else
            {
                // Không hợp lệ, trả về thông báo lỗi (có thể là mặc định hoặc tùy chỉnh)
                return new ValidationResult(ErrorMessage);
            }
        }
    }
}
