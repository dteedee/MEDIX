using Medix.API.Business.Validators;

namespace Medix.API.Models.DTOs.Doctor
{
    public class PasswordUpdatePresenter
    {
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmPassword { get; set; }
    }
}
