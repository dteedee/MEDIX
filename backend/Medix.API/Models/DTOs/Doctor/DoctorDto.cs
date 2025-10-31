namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorDto
    {
        public Guid Id { get; set; }
        public string? AvatarUrl { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public string? Education { get; set; }
        public int YearsOfExperience { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public int StatusCode { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }
}
