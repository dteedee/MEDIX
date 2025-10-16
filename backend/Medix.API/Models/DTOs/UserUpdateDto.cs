namespace Medix.API.Models.DTOs
{
    public class UserUpdateDto
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? GenderCode { get; set; }
        public string? IdentificationNumber { get; set; }
        public List<string>? RoleCodes { get; set; }
        public string? Address { get; set; }
        public bool? EmailConfirmed { get; set; }
        public DateOnly? DateOfBirth { get; set; }
    }
}