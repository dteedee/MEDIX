using System.ComponentModel.DataAnnotations;
using static System.Net.Mime.MediaTypeNames;

namespace Medix.API.Business.Validators
{
    public class DobAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not string dobString || string.IsNullOrWhiteSpace(dobString))
            {
                // Allow empty or null input — considered valid
                return ValidationResult.Success;
            }

            if (!DateTime.TryParse(dobString, out var dob))
            {
                return new ValidationResult("Ngày sinh không hợp lệ");
            }

            var today = DateTime.Today;

            var age = today.Year - dob.Year;
            if (dob > today.AddYears(-age)) age--; // adjust if birthday hasn't occurred yet this year

            if (age < 25)
            {
                return new ValidationResult($"Bạn phải đủ {25} tuổi để đăng ký");
            }

            if (age > 150)
            {
                return new ValidationResult("Ngày sinh không hợp lệ");
            }

            return ValidationResult.Success;

        }
    }
}
