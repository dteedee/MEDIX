using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Medix.API.Business.Interfaces.UserManagement;
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
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password); // Simple password hash

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
                Address = registerDto.address,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = true,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            var savedUser = await _userRepository.CreateAsync(user);
            // TODO: Fix when UserRoleRepository.CreateAsync is implemented
        
            await _userRoleRepository.AssignRole("Patient", savedUser.Id);
            return new UserDto
            {
                Id = savedUser.Id,
                Email = savedUser.Email,
                FullName = savedUser.FullName,
                PhoneNumber = savedUser.PhoneNumber,
                Role = "Patient",
                EmailConfirmed = savedUser.EmailConfirmed,
                CreatedAt = savedUser.CreatedAt
            };
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

        public async Task<bool> PhoneNumberExistsAsync(string phoneNumber) => await _userRepository.ExistsByPhoneNumberAsync(phoneNumber);

        public async Task<bool> UserNameExistsAsync(string userName) => await _userRepository.ExistsByUserNameAsync(userName);

        public async Task<bool> IdentificationNumberExistsAsync(string identificationNumber) => await _userRepository.ExistsByIdentificationNumberAsync(identificationNumber);

        public async Task<User> UpdateUserAsync(User user)
        {
            return await _userRepository.UpdateAsync(user);
        }
        public async Task<UserBasicInfoDto> GetUserBasicInfo(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null) throw new ArgumentException("Không tìm thấy người dùng");

            return new UserBasicInfoDto
            {
                Id = user.Id,
                username = user.UserName,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                imageURL = user.AvatarUrl,
                dob = user.DateOfBirth,
                address = user.Address
            };
        }

        public async Task<UserBasicInfoDto> UpdateUserBasicInfo(UpdateUserDto updateDto)
        {
            var user = await _userRepository.GetByIdAsync(updateDto.Id);
            if (user == null) throw new ArgumentException("Không tìm thấy người dùng");

            if (updateDto.FullName != null)
                user.FullName = updateDto.FullName;
            if (updateDto.PhoneNumber != null)
                user.PhoneNumber = updateDto.PhoneNumber;
            if (updateDto.address != null)
                user.Address = updateDto.address;
            if (updateDto.dob != null)
                user.DateOfBirth = updateDto.dob;
            if (updateDto.Email != null)
                user.Email = updateDto.Email;
            if (updateDto.username != null)
                user.UserName = updateDto.username;

            user.UpdatedAt = DateTime.UtcNow;

            var updatedUser = await _userRepository.UpdateAsync(user);

            return new UserBasicInfoDto
            {
                Id = updatedUser.Id,
                username = updatedUser.UserName,
                FullName = updatedUser.FullName,
                Email = updatedUser.Email,
                PhoneNumber = updatedUser.PhoneNumber,
                address = updatedUser.Address,
                dob = updatedUser.DateOfBirth,
                CreatedAt = updatedUser.CreatedAt
            };
        }

        public async Task<string?> UpdateAvatarURL(string linkImage, Guid id)
        {
            if (string.IsNullOrWhiteSpace(linkImage))
                return null;

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return null;

            user.AvatarUrl = linkImage;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);

            return linkImage;
        }

    }
}