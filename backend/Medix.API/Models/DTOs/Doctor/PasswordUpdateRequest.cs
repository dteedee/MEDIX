using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class PasswordUpdateRequest
    {
        public string? CurrentPassword { get; set; }

        [PasswordComplexity]
        public string? NewPassword { get; set; }

        public string? ConfirmNewPassword { get; set; }
    }
}
