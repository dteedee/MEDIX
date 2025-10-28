using Medix.API.Business.Helper;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorRegistrationFormRepository
    {
        Task<bool> UserNameExistAsync(string userName);
        Task<bool> EmailExistAsync(string email);
        Task<bool> PhoneNumberExistAsync(string phoneNumber);
        Task<bool> IdentificationNumberExistAsync(string identificationNumber);
        Task<bool> LicenseNumberExistAsync(string licenseNumber);
        Task AddAsync(DoctorRegistrationForm form);
        Task<PagedList<DoctorRegistrationForm>> GetAllAsync(DoctorQuery query);
    }
}
