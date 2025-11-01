using Medix.API.Business.Validators;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileUpdatePresenter
    {
        public string UserName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string? Address { get; set; }
    }
}
