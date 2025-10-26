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
            // ✅ 1. Validate cơ bản
            if (string.IsNullOrWhiteSpace(createUserDto.UserName))
                throw new MedixException("Username is required.");
            if (string.IsNullOrWhiteSpace(createUserDto.Email))
                throw new MedixException("Email is required.");

            // ✅ 2. Check username trùng
            var existingUser = await _userRepository.GetByUserNameAsync(createUserDto.UserName);
            if (existingUser != null)
                throw new MedixException($"Username '{createUserDto.UserName}' already exists");

            // ✅ 3. Check email trùng
            var existingEmail = await _userRepository.GetByEmailAsync(createUserDto.Email);
            if (existingEmail != null)
                throw new MedixException($"Email '{createUserDto.Email}' already exists");

            // ✅ 4. Hash password mặc định
            const string defaultPassword = "Abc@123";
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

            // ✅ 5. Tạo entity mới
            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = createUserDto.UserName,
                NormalizedUserName = createUserDto.UserName.ToUpperInvariant(),
                Email = createUserDto.Email,
                NormalizedEmail = createUserDto.Email.ToUpperInvariant(),
                PasswordHash = passwordHash,
                FullName = createUserDto.UserName, // ⚡ FIX: tránh lỗi NULL
                Role = "PATIENT",
                IsProfileCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            // ✅ 6. Lưu vào DB
            var savedUser = await _userRepository.CreateAsync(user);

            // ✅ 7. Map sang DTO trả về
            return new UserDto
            {
                Id = savedUser.Id,
                UserName = savedUser.UserName,
                Email = savedUser.Email,
                Role = savedUser.Role,
                CreatedAt = savedUser.CreatedAt,
                FullName = savedUser.FullName
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
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            // 1️⃣ Update basic info
            user.FullName = userUpdateDto.FullName;
            user.PhoneNumber = userUpdateDto.PhoneNumber;
            user.Address = userUpdateDto.Address;
            user.AvatarUrl = userUpdateDto.AvatarUrl;
            user.DateOfBirth = userUpdateDto.DateOfBirth;
            user.GenderCode = userUpdateDto.GenderCode;
            user.IdentificationNumber = userUpdateDto.IdentificationNumber;
            user.EmailConfirmed = userUpdateDto.EmailConfirmed;
            user.IsProfileCompleted = userUpdateDto.IsProfileCompleted;
            user.LockoutEnabled = userUpdateDto.LockoutEnabled;
            user.LockoutEnd = userUpdateDto.LockoutEnd;
            user.AccessFailedCount = userUpdateDto.AccessFailedCount;
            user.UpdatedAt = DateTime.UtcNow;

            // 2️⃣ Update role
            if (!string.IsNullOrWhiteSpace(userUpdateDto.Role))
            {
                var role = await _userRoleRepository.GetRoleByDisplayNameAsync(userUpdateDto.Role);
                if (role != null)
                {
                    await _userRoleRepository.RemoveAllRolesForUserAsync(user.Id);
                    await _userRoleRepository.CreateAsync(new UserRole
                    {
                        UserId = user.Id,
                        RoleCode = role.Code,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // 3️⃣ Lưu lại user (chỉ cập nhật thông tin cá nhân, không đụng roles)
            await _userRepository.UpdateAsync(user);

            // 4️⃣ Load lại user để lấy role mới
            var refreshedUser = await _userRepository.GetByIdAsync(id);

            // 5️⃣ Map ra DTO
            return new UserDto
            {
                Id = refreshedUser.Id,
                Email = refreshedUser.Email,
                FullName = refreshedUser.FullName,
                PhoneNumber = refreshedUser.PhoneNumber,
                Role = refreshedUser.UserRoles.FirstOrDefault()?.RoleCodeNavigation?.DisplayName ?? "Patient",
                EmailConfirmed = refreshedUser.EmailConfirmed,
                CreatedAt = refreshedUser.CreatedAt,
                DateOfBirth = refreshedUser.DateOfBirth,
                GenderCode = refreshedUser.GenderCode,
                IdentificationNumber = refreshedUser.IdentificationNumber,
                UserName = refreshedUser.UserName,
                Address = refreshedUser.Address,
                AvatarUrl = refreshedUser.AvatarUrl,
                IsProfileCompleted = refreshedUser.IsProfileCompleted,
                LockoutEnd = refreshedUser.LockoutEnd,
                LockoutEnabled = refreshedUser.LockoutEnabled,
                AccessFailedCount = refreshedUser.AccessFailedCount
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
        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.UserRoles.FirstOrDefault()?.RoleCodeNavigation?.DisplayName ?? "Patient",
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
                AccessFailedCount = u.AccessFailedCount
            }).ToList();
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
                Role = u.UserRoles.FirstOrDefault()?.RoleCodeNavigation?.DisplayName ?? "Patient",
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