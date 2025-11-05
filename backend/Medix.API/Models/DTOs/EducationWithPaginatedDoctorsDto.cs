namespace Medix.API.Models.DTOs
{
    public class EducationWithPaginatedDoctorsDto
    {
        public string EducationCode { get; set; } = string.Empty; // Từ DoctorDegree.Code
        public string Education { get; set; } = string.Empty;     // Từ DoctorDegree.Name
        public string? Description { get; set; }                 // Từ DoctorDegree.Description
        public PaginatedListDto<DoctorBookinDto> Doctors { get; set; } = new(new List<DoctorBookinDto>(), 1, 10, 0);
    }
}
