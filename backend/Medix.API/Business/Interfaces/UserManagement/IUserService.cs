using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IUserService
    {
        Task<UserDto> RegisterUserAsync(RegisterRequestPatientDTO registerRequest);
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto?> GetByEmailAsync(string email);
        Task<UserDto> UpdateAsync(Guid id, UserUpdateDto userUpdateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<(int total, IEnumerable<UserDto> data)> GetPagedAsync(int page, int pageSize);
        Task<IEnumerable<UserDto>> SearchByNameAsync(string keyword);
        Task<bool> EmailExistsAsync(string email);
    }
}