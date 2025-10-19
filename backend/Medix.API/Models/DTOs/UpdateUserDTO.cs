using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs
{
    public class UpdateUserDTO
    {
        // Basic user information for viewing
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? GenderCode { get; set; }
        public string? IdentificationNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool IsProfileCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Fields that can be updated
        public string Role { get; set; } = string.Empty;

        public bool LockoutEnabled { get; set; }

        public DateTime? LockoutEnd { get; set; }

        public int AccessFailedCount { get; set; }
    }
}
