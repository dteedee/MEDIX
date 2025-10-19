using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs
{
    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; } = new();
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? GenderCode { get; set; }
        public string? IdentificationNumber { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsProfileCompleted { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }
    }
    public class UserBasicInfoDto
    {
        public Guid Id { get; set; }
        public string? username { get; set; } = string.Empty;
        public string? FullName { get; set; } = string.Empty;
        public string? Email { get; set; } = string.Empty;
        public string? imageURL { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? address { get; set; }
        public DateOnly? dob { get; set; }

  
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateUserDto
    {
        public Guid? Id { get; set; }
        public string? username { get; set; } = string.Empty;
        public string? FullName { get; set; } = string.Empty;
        [EmailAddress]
        public string? Email { get; set; } = string.Empty;
        [Phone(ErrorMessage ="Số diện thoại không hơp lệ")]
        public string? PhoneNumber { get; set; } 
        public string? address { get; set; }
        public DateOnly? dob { get; set; }
       
    }


    public class GoogleLoginRequestDto
    {
        public string IdToken { get; set; } = string.Empty;
    }
}
