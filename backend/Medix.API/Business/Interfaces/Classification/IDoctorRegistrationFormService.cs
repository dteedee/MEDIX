using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Helper;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorRegistrationFormService
    {
        Task<bool> IsUserNameExistAsync(string userName);
        Task<bool> IsEmailExistAsync(string email);
        Task<bool> IsPhoneNumberExistAsync(string phoneNumber);
        Task<bool> IsIdentificationNumberExistAsync(string identificationNumber);
        Task<bool> IsLicenseNumberExistAsync(string licenseNumber);
        Task RegisterDoctorAsync(DoctorRegisterRequest request);
        Task<PagedList<DoctorRegistrationForm>> GetAllRegistrationFormsAsync(DoctorQuery query);
    }
}
