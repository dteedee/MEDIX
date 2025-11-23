namespace Medix.API.Models.DTOs.Specialization
{
    public class SpecializationListDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DoctorCount { get; set; }
    }
}

