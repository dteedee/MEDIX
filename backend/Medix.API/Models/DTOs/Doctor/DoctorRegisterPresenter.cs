using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorRegisterPresenter
    {
        public IFormFile? Avatar { get; set; }
        public string? FullName { get; set; }
        public string? UserName { get; set; }
        public string? Dob { get; set; }
        public string? GenderCode { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? SpecializationId { get; set; }
        public string? LicenseNumber { get; set; }
        public IFormFile? LicenseImage { get; set; }
        public IFormFile? DegreeFiles { get; set; }
        public string? Bio { get; set; }
        public string? Education { get; set; }
        public int? YearsOfExperience { get; set; } = 0;
    }
}
