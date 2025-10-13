using System.ComponentModel.DataAnnotations;
using Medix.API.Application.Util;
using Medix.API.Application.ValidateAttribute;

namespace Medix.API.Application.DTO
{
    public class RegisterRequestPatientDto
    {
        [Required(ErrorMessage = "Email is not empty")]
        [EmailAddress(ErrorMessage = "Email is not valid")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [PasswordComplexityAttribute]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare("Password", ErrorMessage = "Password and confirmation do not match")]
        public string PasswordConfirmation { get; set; } = null!;

        [Required(ErrorMessage = "Full name is required")]
        [MinLength(2, ErrorMessage = "Full name must be at least 2 characters")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = null!;

        [Phone(ErrorMessage = "Phone number is not valid")]
        public string? PhoneNumber { get; set; }

        [DataType(DataType.Date, ErrorMessage = "Date of birth is not valid")]
        public DateOnly? DateOfBirth { get; set; }

        [MaxLength(20, ErrorMessage = "Identification number cannot exceed 20 characters")]
        public string? IdentificationNumber { get; set; }

        [MaxLength(10, ErrorMessage = "Gender code cannot exceed 10 characters")]
        [GenderCodeValidationAttribute]
        public string? GenderCode { get; set; }
    }
}