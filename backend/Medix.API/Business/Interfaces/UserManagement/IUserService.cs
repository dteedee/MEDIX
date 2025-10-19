using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IUserService
    {
        Task<UserDto> RegisterUserAsync(RegisterRequestPatientDTO registerRequest);
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto?> GetByEmailAsync(string email);
        Task<UserDto> UpdateAsync(Guid id, UserDto userDto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<bool> EmailExistsAsync(string email);
        Task<bool> PhoneNumberExistsAsync(string phoneNumber);
        Task<bool> UserNameExistsAsync(string userName);
        Task<bool> IdentificationNumberExistsAsync(string identificationNumber);
        Task<User> UpdateUserAsync(User user);
        Task<UserBasicInfoDto> GetUserBasicInfo(Guid id);

        Task<UserBasicInfoDto> UpdateUserBasicInfo(UpdateUserDto updateDto);
        Task<string> UpdateAvatarURL(string linkImage, Guid id);

    }
}