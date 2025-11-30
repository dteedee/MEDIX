using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Authen
{
    public class RefreshTokenRequestDto
    {
        [Required(ErrorMessage = "Refresh token is required")]
        public string RefreshToken { get; set; } = string.Empty;
    }
}

