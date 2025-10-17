using System;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Business.Validators
{
    public class MinAgeAttribute : ValidationAttribute
    {
        private readonly int _minAge;
        public MinAgeAttribute(int minAge)
        {
            _minAge = minAge;
            ErrorMessage = $"Người dùng phải từ {_minAge} tuổi trở lên.";
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null) return ValidationResult.Success;
            if (value is DateOnly dob)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var age = today.Year - dob.Year - (today.DayOfYear < dob.DayOfYear ? 1 : 0);
                if (age >= _minAge)
                    return ValidationResult.Success;
            }
            return new ValidationResult(ErrorMessage);
        }
    }
}