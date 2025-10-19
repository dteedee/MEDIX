using Medix.API.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IUserService
    {
        Task<UserDto> RegisterUserAsync(RegisterRequestPatientDTO registerDto);
        Task<UserDto> CreateUserAsync(CreateUserDTO createUserDto);
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto?> GetByEmailAsync(string email);
        Task<UserDto> UpdateAsync(Guid id, UpdateUserDTO userUpdateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<(int total, IEnumerable<UserDto> data)> GetPagedAsync(int page, int pageSize);
        Task<(int total, IEnumerable<UserDto> data)> SearchAsync(string keyword, int page, int pageSize);
        Task<bool> EmailExistsAsync(string email);
    }
}