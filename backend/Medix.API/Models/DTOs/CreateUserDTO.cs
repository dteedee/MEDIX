using System.ComponentModel.DataAnnotations;
using Medix.API.Business.Validators;

namespace Medix.API.Models.DTOs
{
    public class CreateUserDTO
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [PasswordComplexityAttribute]
        public string Password { get; set; } = string.Empty;
    }
}
