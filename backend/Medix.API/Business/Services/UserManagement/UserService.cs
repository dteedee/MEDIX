using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.UserManagement;
// using Medix.API.Business.Util; // Removed for performance

namespace Medix.API.Business.Services.UserManagement
{
    public class UserService : IUserService
    {
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPatientRepository _patientRepository;

        public UserService(IUserRepository userRepository, IPatientRepository patientRepository, IUserRoleRepository userRoleRepository)
        {
            _userRepository = userRepository;
            _patientRepository = patientRepository;
            _userRoleRepository = userRoleRepository;
        }

        public async Task<UserDto> RegisterUserAsync(RegisterRequestPatientDTO registerDto)
        {
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            User user = new User
            {
                Id = Guid.NewGuid(),
                UserName = registerDto.Email,
                NormalizedUserName = registerDto.Email.ToUpperInvariant(),
                Email = registerDto.Email,
                NormalizedEmail = registerDto.Email.ToUpperInvariant(),
                PasswordHash = passwordHash,
                PhoneNumber = registerDto.PhoneNumber,
                FullName = registerDto.FullName,
                DateOfBirth = registerDto.DateOfBirth,
                GenderCode = registerDto.GenderCode,
                IdentificationNumber = registerDto.IdentificationNumber,
              
                IsProfileCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            var savedUser = await _userRepository.CreateAsync(user);
            var role = await _userRoleRepository.AssignRole("Patient", savedUser.Id);

            // Map User to UserDTO
            var userDTO = new UserDto
            {
                Id = savedUser.Id,
           
                PhoneNumber = savedUser.PhoneNumber,
                FullName = savedUser.FullName,
                Email = savedUser.Email,
                EmailConfirmed = savedUser.EmailConfirmed,
                DateOfBirth = savedUser.DateOfBirth,
                Role = role,
                CreatedAt = savedUser.CreatedAt,

            };

            return userDTO;
        }

        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                EmailConfirmed = user.EmailConfirmed,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserDto?> GetByEmailAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                EmailConfirmed = user.EmailConfirmed,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserDto> UpdateAsync(Guid id, UserDto userDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) throw new ArgumentException("Không tìm thấy người dùng");

            user.FullName = userDto.FullName;
            user.PhoneNumber = userDto.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            var updatedUser = await _userRepository.UpdateAsync(user);

            return new UserDto
            {
                Id = updatedUser.Id,
                Email = updatedUser.Email,
                FullName = updatedUser.FullName,
                PhoneNumber = updatedUser.PhoneNumber,
                Role = updatedUser.Role,
                EmailConfirmed = updatedUser.EmailConfirmed,
                CreatedAt = updatedUser.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _userRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            // TODO: Fix when UserRepository.GetAllAsync is implemented
            await Task.Delay(1); // Placeholder for async operation
            var users = new List<User>(); // await _userRepository.GetAllAsync();
            return users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt
            });
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            return user != null;
        }
    }
}