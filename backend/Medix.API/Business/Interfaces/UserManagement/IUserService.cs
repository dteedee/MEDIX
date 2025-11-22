using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IUserService
    {
        Task<UserDto> RegisterUserAsync(RegisterRequestPatientDTO registerDto);
        Task<UserDto> CreateUserAsync(CreateUserDTO createUserDto, string password); 
        Task<UserDto?> GetByIdAsync(Guid id);
        Task<UserDto?> GetByEmailAsync(string email);
        Task<UserDto> UpdateAsync(Guid id, UpdateUserDTO userUpdateDto, Guid currentUserId);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<(int total, IEnumerable<UserDto> data)> GetPagedAsync(int page, int pageSize);
        Task<(int total, IEnumerable<UserDto> data)> SearchAsync(string keyword, int page, int pageSize);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> PhoneNumberExistsAsync(string phoneNumber);
        Task<bool> UserNameExistsAsync(string userName);
        Task<bool> IdentificationNumberExistsAsync(string identificationNumber);
    Task<User> UpdateUserAsync(User user);
        Task<UserBasicInfoDto> GetUserBasicInfo(Guid id);

        Task<UserBasicInfoDto> UpdateUserBasicInfo(UpdateUserDto updateDto);
        Task<string?> UpdateAvatarURL(string linkImage, Guid id);
        Task<UserDto> AdminResetPasswordAsync(Guid userId, string newPassword);
        Task<User?> GetUserAsync(Guid userId);

        Task<UserGrowthDto> GetUserGrowthAsync(int year);
        Task<ManagerDashboardSummaryDto> GetSummaryAsync();
    }
}