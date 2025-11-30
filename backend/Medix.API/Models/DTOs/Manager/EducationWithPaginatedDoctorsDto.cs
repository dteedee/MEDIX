using Medix.API.Models.DTOs.Patient;

namespace Medix.API.Models.DTOs.Manager
{
    public class EducationWithPaginatedDoctorsDto
    {
        public string EducationCode { get; set; } = string.Empty; 
        public string Education { get; set; } = string.Empty;     
        public string? Description { get; set; }                 
        public PaginatedListDto<DoctorBookinDto> Doctors { get; set; } = new(new List<DoctorBookinDto>(), 1, 10, 0);
    }
}
