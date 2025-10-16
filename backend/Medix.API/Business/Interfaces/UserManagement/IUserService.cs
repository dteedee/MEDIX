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
    }
}