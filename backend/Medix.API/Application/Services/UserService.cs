using Medix.API.Application.DTO;
using Medix.API.Data.Models;
using Medix.API.Data.Repositories;
using Org.BouncyCastle.Crypto.Generators;

namespace Medix.API.Application.Services
{

   public interface IUserService
    {
        public Task<UserDTO> RegisterUserAsync(RegisterDTO registerDTo);

    }
    public class UserService : IUserService
    { private readonly IUserRepository _userRepository;
        private readonly IPatientRepository _patientRepository;
        public UserService(IUserRepository userRepository, IPatientRepository patientRepository)
        {
            _userRepository = userRepository;
            _patientRepository = patientRepository;
        }

        public async Task<UserDTO> RegisterUserAsync(RegisterDTO registerDto)
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
                IsActive = true,
                IsProfileCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            var savedUser = await _userRepository.SaveUserAsync(user);

            // Map User to UserDTO
            var userDTO = new UserDTO
            {
                Id = savedUser.Id,
                NormalizedUserName = savedUser.NormalizedUserName,
                NormalizedEmail = savedUser.NormalizedEmail,
                PhoneNumber = savedUser.PhoneNumber,
                FullName = savedUser.FullName,
                DateOfBirth = savedUser.DateOfBirth,
                GenderCode = savedUser.GenderCode,
                IdentificationNumber = savedUser.IdentificationNumber,
                Address = savedUser.Address,
                AvatarUrl = savedUser.AvatarUrl,
                IsActive = savedUser.IsActive,
                IsProfileCompleted = savedUser.IsProfileCompleted,
                LockoutEnd = savedUser.LockoutEnd,
                LockoutEnabled = savedUser.LockoutEnabled,
                AccessFailedCount = savedUser.AccessFailedCount,
                CreatedAt = savedUser.CreatedAt,
                UpdatedAt = savedUser.UpdatedAt
            };

            return userDTO;
        }
    }
}
