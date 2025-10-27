using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileUpdatePresenter
    {
        public string FullName { get; set; } = null!;
        public string? Dob { get; set; }
        public string PhoneNumber { get; set; } = null!;
        public string? Bio { get; set; }
        public string? Education { get; set; }
        public int? YearsOfExperience { get; set; } = 0;
    }
}
