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
                Role = "Patient", // Gán vai trò mặc định là Patient
                IsProfileCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = true,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            var savedUser = await _userRepository.CreateAsync(user);
            // TODO: Fix when UserRoleRepository.CreateAsync is implemented
            // await _userRoleRepository.CreateAsync(new UserRole { UserId = savedUser.Id, RoleCode = "Patient" });

            return new UserDto
            {
                Id = savedUser.Id,
                Email = savedUser.Email,
                FullName = savedUser.FullName,
                PhoneNumber = savedUser.PhoneNumber,
                Role = savedUser.Role, // Lấy vai trò từ đối tượng đã được lưu
                EmailConfirmed = savedUser.EmailConfirmed,
                CreatedAt = savedUser.CreatedAt,
                DateOfBirth = savedUser.DateOfBirth,
                GenderCode = savedUser.GenderCode,
                IdentificationNumber = savedUser.IdentificationNumber
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
                CreatedAt = user.CreatedAt,
                DateOfBirth = user.DateOfBirth,
                GenderCode = user.GenderCode,
                IdentificationNumber = user.IdentificationNumber
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
                CreatedAt = user.CreatedAt,
                DateOfBirth = user.DateOfBirth,
                GenderCode = user.GenderCode,
                IdentificationNumber = user.IdentificationNumber
            };
        }

        public async Task<UserDto> UpdateAsync(Guid id, UserUpdateDto userUpdateDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) throw new ArgumentException("Không tìm thấy người dùng");

            // Chỉ cập nhật các trường nếu chúng được cung cấp giá trị mới
            user.FullName = userUpdateDto.FullName ?? user.FullName;
            user.PhoneNumber = userUpdateDto.PhoneNumber ?? user.PhoneNumber;
            user.GenderCode = userUpdateDto.GenderCode ?? user.GenderCode;
            user.IdentificationNumber = userUpdateDto.IdentificationNumber ?? user.IdentificationNumber;
            user.DateOfBirth = userUpdateDto.DateOfBirth ?? user.DateOfBirth;
            user.EmailConfirmed = userUpdateDto.EmailConfirmed ?? user.EmailConfirmed;

            // Cập nhật vai trò nếu được cung cấp
            if (userUpdateDto.RoleCodes != null && userUpdateDto.RoleCodes.Any())
            {
                user.Role = userUpdateDto.RoleCodes.First(); // Lấy vai trò đầu tiên từ mảng
            }

            user.Address = userUpdateDto.Address ?? user.Address;
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
                CreatedAt = updatedUser.CreatedAt,
                GenderCode = updatedUser.GenderCode,
                IdentificationNumber = updatedUser.IdentificationNumber,
                DateOfBirth = updatedUser.DateOfBirth
            };
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _userRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            // TODO: Fix when UserRepository.GetAllAsync is implemented
            var users = await _userRepository.GetAllAsync();
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

        public async Task<(int total, IEnumerable<UserDto> data)> GetPagedAsync(int page, int pageSize)
        {
            var (total, users) = await _userRepository.GetPagedAsync(page, pageSize);

            var data = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt,
                DateOfBirth = u.DateOfBirth,
                GenderCode = u.GenderCode,
                IdentificationNumber = u.IdentificationNumber
            });

            return (total, data);
        }

        public async Task<(int total, IEnumerable<UserDto> data)> SearchAsync(string keyword, int page, int pageSize)
        {
            var (total, users) = await _userRepository.SearchAsync(keyword, page, pageSize);

            var data = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt,
                DateOfBirth = u.DateOfBirth,
                GenderCode = u.GenderCode,
                IdentificationNumber = u.IdentificationNumber
            });

            return (total, data);
        }

        public async Task<IEnumerable<UserDto>> SearchByNameAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Enumerable.Empty<UserDto>();
            }

            var users = await _userRepository.SearchByNameAsync(keyword);

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