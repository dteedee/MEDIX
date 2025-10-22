using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Exceptions;
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
                Status = 0,
                IdentificationNumber = registerDto.IdentificationNumber,
                Role = "Patient", // Gán vai trò mặc định là Patient
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
                Role = savedUser.Role, // Lấy vai trò từ đối tượng đã được lưu
                EmailConfirmed = savedUser.EmailConfirmed,
                CreatedAt = savedUser.CreatedAt,
                DateOfBirth = savedUser.DateOfBirth,
                GenderCode = savedUser.GenderCode,
                IdentificationNumber = savedUser.IdentificationNumber,
                UserName = savedUser.UserName,
                Address = savedUser.Address,
                AvatarUrl = savedUser.AvatarUrl,
                IsProfileCompleted = savedUser.IsProfileCompleted,
                LockoutEnd = savedUser.LockoutEnd,
                LockoutEnabled = savedUser.LockoutEnabled,
                AccessFailedCount = savedUser.AccessFailedCount
            };
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDTO createUserDto)
        {
            // Check if username already exists
            var existingUser = await _userRepository.GetByUserNameAsync(createUserDto.UserName);
            if (existingUser != null)
            {
                throw new MedixException($"Username '{createUserDto.UserName}' already exists");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

            User user = new User
            {
                Id = Guid.NewGuid(),
                UserName = createUserDto.UserName,
                NormalizedUserName = createUserDto.UserName.ToUpperInvariant(),
                Email = createUserDto.UserName + "@temp.com", // Temporary email based on username
                NormalizedEmail = (createUserDto.UserName + "@temp.com").ToUpperInvariant(),
                PasswordHash = passwordHash,
                PhoneNumber = null,
                FullName = createUserDto.UserName, // Use username as full name initially
                Role = "PATIENT", // Default role
                IsProfileCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            try
            {
                var savedUser = await _userRepository.CreateAsync(user);

                return new UserDto
            {
                Id = savedUser.Id,
                Email = savedUser.Email,
                FullName = savedUser.FullName,
                PhoneNumber = savedUser.PhoneNumber,
                Role = savedUser.Role,
                EmailConfirmed = savedUser.EmailConfirmed,
                CreatedAt = savedUser.CreatedAt,
                DateOfBirth = savedUser.DateOfBirth,
                GenderCode = savedUser.GenderCode,
                IdentificationNumber = savedUser.IdentificationNumber,
                UserName = savedUser.UserName,
                Address = savedUser.Address,
                AvatarUrl = savedUser.AvatarUrl,
                IsProfileCompleted = savedUser.IsProfileCompleted,
                LockoutEnd = savedUser.LockoutEnd,
                LockoutEnabled = savedUser.LockoutEnabled,
                AccessFailedCount = savedUser.AccessFailedCount
            };
            }
            catch (Exception ex) when (ex.InnerException?.Message.Contains("UK_Users_NormalizedUserName") == true || 
                                     ex.InnerException?.Message.Contains("UK_Users_NormalizedEmail") == true)
            {
                throw new MedixException($"Username '{createUserDto.UserName}' already exists");
            }
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
                IdentificationNumber = user.IdentificationNumber,
                UserName = user.UserName,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                IsProfileCompleted = user.IsProfileCompleted,
                LockoutEnd = user.LockoutEnd,
                LockoutEnabled = user.LockoutEnabled,
                AccessFailedCount = user.AccessFailedCount
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
                IdentificationNumber = user.IdentificationNumber,
                UserName = user.UserName,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                IsProfileCompleted = user.IsProfileCompleted,
                LockoutEnd = user.LockoutEnd,
                LockoutEnabled = user.LockoutEnabled,
                AccessFailedCount = user.AccessFailedCount
            };
        }

        public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDTO userUpdateDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) throw new NotFoundException($"User with ID {id} not found");

            // Update basic information
            user.FullName = userUpdateDto.FullName;
            user.PhoneNumber = userUpdateDto.PhoneNumber;
            user.Address = userUpdateDto.Address;
            user.AvatarUrl = userUpdateDto.AvatarUrl;
            user.DateOfBirth = userUpdateDto.DateOfBirth;
            user.GenderCode = userUpdateDto.GenderCode;
            user.IdentificationNumber = userUpdateDto.IdentificationNumber;
            user.EmailConfirmed = userUpdateDto.EmailConfirmed;
            user.IsProfileCompleted = userUpdateDto.IsProfileCompleted;

            // Update role and security settings
            user.Role = userUpdateDto.Role;
            user.LockoutEnabled = userUpdateDto.LockoutEnabled;
            user.LockoutEnd = userUpdateDto.LockoutEnd;
            user.AccessFailedCount = userUpdateDto.AccessFailedCount;

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
                DateOfBirth = updatedUser.DateOfBirth,
                UserName = updatedUser.UserName,
                Address = updatedUser.Address,
                AvatarUrl = updatedUser.AvatarUrl,
                IsProfileCompleted = updatedUser.IsProfileCompleted,
                LockoutEnd = updatedUser.LockoutEnd,
                LockoutEnabled = updatedUser.LockoutEnabled,
                AccessFailedCount = updatedUser.AccessFailedCount
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
                IdentificationNumber = u.IdentificationNumber,
                UserName = u.UserName,
                Address = u.Address,
                AvatarUrl = u.AvatarUrl,
                IsProfileCompleted = u.IsProfileCompleted,
                LockoutEnd = u.LockoutEnd,
                LockoutEnabled = u.LockoutEnabled,
                AccessFailedCount = u.AccessFailedCount,
              
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
                IdentificationNumber = u.IdentificationNumber,
                UserName = u.UserName,
                Address = u.Address,
                AvatarUrl = u.AvatarUrl,
                IsProfileCompleted = u.IsProfileCompleted,
                LockoutEnd = u.LockoutEnd,
                LockoutEnabled = u.LockoutEnabled,
                AccessFailedCount = u.AccessFailedCount,
              
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