using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class PasswordUpdateRequest
    {
        public string? CurrentPassword { get; set; }

        [Required(ErrorMessage = "New password is required")]
        public string? NewPassword { get; set; }

        public string? ConfirmPassword { get; set; }
    }
}
