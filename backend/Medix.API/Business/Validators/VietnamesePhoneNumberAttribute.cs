using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Medix.API.Business.Validators
{
    public class VietnamesePhoneNumberAttribute : ValidationAttribute
    {
        public VietnamesePhoneNumberAttribute()
        {
            ErrorMessage = "Số điện thoại không hợp lệ. Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0.";
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {

            if (value == null || string.IsNullOrEmpty(value.ToString()))
            {
                return ValidationResult.Success;
            }

            string phoneNumber = value.ToString();
            string pattern = @"^0\d{9}$";

            if (Regex.IsMatch(phoneNumber, pattern))
            {
                return ValidationResult.Success;
            }
            else
            {
                return new ValidationResult(ErrorMessage);
            }
        }
    }
}
