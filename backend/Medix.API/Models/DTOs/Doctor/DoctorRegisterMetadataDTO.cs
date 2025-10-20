namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorRegisterMetadataDto
    {
        public List<SpecializationDto> Specializations { get; set; } = new List<SpecializationDto>();
    }

    public class SpecializationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
