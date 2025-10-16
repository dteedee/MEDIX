using System.ComponentModel.DataAnnotations;
using static System.Net.Mime.MediaTypeNames;

namespace Medix.API.Business.Validators
{
    public class DobAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
            {
                return ValidationResult.Success;
            }

            if (value is not string dobString || !DateTime.TryParse(dobString, out var dob))
            {
                return new ValidationResult("Ngày sinh không hợp lệ");
            }

            var today = DateTime.Today;

            if (dob > today)
            {
                return new ValidationResult("Ngày sinh không được nằm trong tương lai");
            }

            var age = today.Year - dob.Year;
            if (dob > today.AddYears(-age)) age--; // adjust if birthday hasn't occurred yet this year

            if (age < 18)
            {
                return new ValidationResult($"Bạn phải đủ {18} tuổi để đăng ký");
            }

            if (age > 150)
            {
                return new ValidationResult("Ngày sinh không hợp lệ");
            }

            return ValidationResult.Success;

        }
    }
}
