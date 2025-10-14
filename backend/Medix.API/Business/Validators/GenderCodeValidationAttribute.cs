using System.ComponentModel.DataAnnotations;

namespace Medix.API.Business.Validators
{
    public class GenderCodeValidationAttribute : ValidationAttribute
    {
        private static readonly string[] AllowedValues = { "Male", "Female", "Others" };

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null) return ValidationResult.Success;
            var str = value.ToString();
            if (AllowedValues.Contains(str, StringComparer.OrdinalIgnoreCase))
                return ValidationResult.Success;
            return new ValidationResult("Gender code must be 'Male', 'Female', or 'Others'");
        }
    }
}
