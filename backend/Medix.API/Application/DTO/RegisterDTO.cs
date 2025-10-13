namespace Medix.API.Application.DTO
{
    public class RegisterDTO
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? GenderCode { get; set; }
    }
}