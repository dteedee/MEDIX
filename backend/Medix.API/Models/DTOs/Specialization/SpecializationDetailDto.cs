namespace Medix.API.Models.DTOs.Specialization
{
    public class SpecializationDetailDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DoctorCount { get; set; }
        public string? Overview { get; set; }
        public string? Services { get; set; }
        public string? Technology { get; set; }
    }
}

