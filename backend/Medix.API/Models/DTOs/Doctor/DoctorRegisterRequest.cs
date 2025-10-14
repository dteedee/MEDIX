using System.ComponentModel.DataAnnotations;
using Medix.API.Business.Validators;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorRegisterRequest
    {
        [Required(ErrorMessage = "Vui l�ng nh?p h? v� t�n")]
        [MaxLength(200, ErrorMessage = "H? v� t�n kh�ng du?c vu?t qu� 200 k� t?")]
        public string FullName { get; set; } = null!;
        public string? Dob { get; set; }
        public string? GenderCode { get; set; }
        [Required(ErrorMessage = "Vui l�ng nh?p s? CCCD/CMND")]
        [MaxLength(50, ErrorMessage = "S? CCCD/CMND kh�ng du?c vu?t qu� 50 k� t?")]
        public string IdentificationNumber { get; set; } = null!;
        [Required(ErrorMessage = "Vui l�ng nh?p email")]
        [EmailAddress(ErrorMessage = "Email kh�ng h?p l?")]
        public string Email { get; set; } = null!;
        [Required(ErrorMessage = "Vui l�ng nh?p s? di?n tho?i")]
        [Phone(ErrorMessage = "S? di?n tho?i kh�ng h?p l?")]
        [MaxLength(20, ErrorMessage = "S? di?n tho?i kh�ng du?c vu?t qu� 20 k� t?")]
        public string PhoneNumber { get; set; } = null!;
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Vui l�ng ch?n chuy�n khoa")]
        public string SpecializationId { get; set; } = null!;
        [Required(ErrorMessage = "Vui l�ng nh?p s? gi?y ph�p h�nh ngh?")]
        public string LicenseNumber { get; set; } = null!;
        [ImageFile]
        public IFormFile? LicenseImage { get; set; }
        [MaxLength(1000, ErrorMessage = "Ti?u s? kh�ng du?c vu?t qu� 1000 k� t?")]
        public string? Bio { get; set; }
        [MaxLength(1000, ErrorMessage = "H?c v?n kh�ng du?c vu?t qu� 1000 k� t?")]
        public string? Education { get; set; }
        [Required(ErrorMessage = "Vui l�ng nh?p s? nam kinh nghi?m")]
        [Range(1, 50, ErrorMessage = "S? nam kinh nghi?m kh�ng h?p l?")]
        public int YearsOfExperience { get; set; } = 0;
    }
}
