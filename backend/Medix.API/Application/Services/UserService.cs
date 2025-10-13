using Medix.API.Application.DTO;
using Medix.API.Application.DTOs.Auth;
using Medix.API.Application.Util;
using Medix.API.Data.Models;
using Medix.API.Data.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Medix.API.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRoleRepository userRoleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPatientRepository _patientRepository;
        public UserService(IUserRepository userRepository, IPatientRepository patientRepository, IUserRoleRepository userRoleRepository)
        {
            _userRepository = userRepository;
            _patientRepository = patientRepository;
            this.userRoleRepository = userRoleRepository;
        }
        public async Task<UserDto> RegisterUserAsync(DTO.RegisterRequestPatientDto registerDto)
        {

            string passwordHash = PasswordHasher.HashPassword(registerDto.Password);

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
                EmailConfirmed = true,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            var savedUser = await _userRepository.CreateAsync(user);
            var role = await userRoleRepository.AssignRole("Patient", savedUser.Id);
                
            // Map User to UserDTO
            var userDTO = new UserDto
            {   Id = savedUser.Id,
                Email = savedUser.Email,
                FullName = savedUser.FullName,
                PhoneNumber = savedUser.PhoneNumber,
                Role =role,
                EmailConfirmed = savedUser.EmailConfirmed,
                CreatedAt = savedUser.CreatedAt

            };

            return userDTO;
        }
    }
}
