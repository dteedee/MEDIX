using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Medix.API.Business.Validators
{
    public class DobAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is not string dobString || string.IsNullOrWhiteSpace(dobString))
            {
                return ValidationResult.Success;
            }

            if (!DateTime.TryParseExact(dobString, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
            {
                return new ValidationResult("Ngày sinh không hợp lệ", new[] { validationContext.MemberName });
            }

            var today = DateTime.Today;

            if (dob > today)
            {
                return new ValidationResult($"Bạn phải đủ {25} tuổi để đăng ký", new[] { validationContext.MemberName });
            }

            var age = today.Year - dob.Year;
            if (dob > today.AddYears(-age)) age--; 

            if (age < 25)
            {
                return new ValidationResult($"Bạn phải đủ {25} tuổi để đăng ký", new[] { validationContext.MemberName });
            }

            if (age > 150)
            {
                return new ValidationResult("Ngày sinh không hợp lệ", new[] { validationContext.MemberName });
            }
            return ValidationResult.Success;

        }
    }
}
