using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.Entities;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Exceptions;
using AutoMapper;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs.Authen;
using Medix.API.Models.DTOs.Admin;
using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Business.Services.UserManagement
{
    public class UserService : IUserService
    {
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IMapper _mapper;
   

        public UserService(IUserRepository userRepository, IPatientRepository patientRepository, IUserRoleRepository userRoleRepository, IMapper mapper)
        {
            _userRepository = userRepository;
            _patientRepository = patientRepository;
            _userRoleRepository = userRoleRepository;
            _mapper = mapper;
        }

        public async Task<ManagerDashboardSummaryDto> GetSummaryAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var startCurrent = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var startPrevious = startCurrent.AddMonths(-1);
                var endCurrent = startCurrent.AddMonths(1).AddTicks(-1);
                var endPrevious = startCurrent.AddTicks(-1);

                var summary = await _userRepository.GetSummaryAsync(startCurrent, endCurrent, startPrevious, endPrevious);
                return summary;
            }
            catch (Exception ex)
            {
              return null;
            }
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
                Status = 0,
                IdentificationNumber = registerDto.IdentificationNumber,
                Role = "Patient", 
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
        
            await _userRoleRepository.AssignRole("Patient", savedUser.Id);
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


        public async Task<UserGrowthDto> GetUserGrowthAsync(int year)
        {
            try
            {
                var monthly = (await _userRepository.GetMonthlyUserAndDoctorCountsAsync(year))
                    .OrderBy(m => m.Month)
                    .ToList();

                var result = new UserGrowthDto
                {
                    Year = year,
                    Monthly = monthly,
                    TotalNewUsers = monthly.Sum(m => m.NewUsers),
                    TotalNewDoctors = monthly.Sum(m => m.NewDoctors)
                };

                return result;
            }
            catch (Exception ex)
            {
             return null;
            }
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDTO createUserDto, string password)
{
    if (await _userRepository.GetByUserNameAsync(createUserDto.UserName) != null)
    {
        throw new MedixException("Username đã tồn tại.");
    }

    if (await EmailExistsAsync(createUserDto.Email))
    {
        throw new MedixException("Email đã tồn tại.");
    }

    var user = new User
    {
        Id = Guid.NewGuid(),
        UserName = createUserDto.UserName,
        NormalizedUserName = createUserDto.UserName.ToUpperInvariant(),
        Email = createUserDto.Email,
        FullName = createUserDto.UserName, 
        NormalizedEmail = createUserDto.Email.ToUpperInvariant(),
        EmailConfirmed = true, 
        PhoneNumberConfirmed = false,
        Status = 1, 
        IsProfileCompleted = false,
        LockoutEnabled = false,
        AccessFailedCount = 0,
        CreatedAt = DateTime.UtcNow,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password) 
    };

    var createdUser = await _userRepository.CreateAsync(user);

    var userRole = new UserRole
    {
        UserId = createdUser.Id,
        RoleCode = createUserDto.Role, 
        CreatedAt = DateTime.UtcNow
    };
    await _userRoleRepository.CreateAsync(userRole);

    var userDto = _mapper.Map<UserDto>(createdUser);
    userDto.Role = createUserDto.Role;

    return userDto;
}





        public async Task<UserDto?> GetByIdAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> GetByEmailAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null) return null;
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDTO userUpdateDto, Guid currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                throw new NotFoundException($"User with ID {id} not found");

            if (userUpdateDto.LockoutEnabled && !user.LockoutEnabled && user.Id == currentUserId)
            {
                throw new MedixException("Bạn không thể tự khóa tài khoản của chính mình.");
            }

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

            await _userRepository.UpdateAsync(user);

            var refreshedUser = await _userRepository.GetByIdAsync(id);

            return _mapper.Map<UserDto>(refreshedUser);
        }



        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _userRepository.DeleteAsync(id);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }
        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();

            return _mapper.Map<IEnumerable<UserDto>>(users).ToList();
        }

        public async Task<(int total, IEnumerable<UserDto> data)> GetPagedAsync(int page, int pageSize)
        {
            var (total, users) = await _userRepository.GetPagedAsync(page, pageSize);

            var data = _mapper.Map<IEnumerable<UserDto>>(users);
            return (total, data);
        }

        public async Task<(int total, IEnumerable<UserDto> data)> SearchAsync(string keyword, int page, int pageSize)
        {
            var (total, users) = await _userRepository.SearchAsync(keyword, page, pageSize);
            var data = _mapper.Map<IEnumerable<UserDto>>(users);
            return (total, data);
        }

        public async Task<IEnumerable<UserDto>> SearchByNameAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Enumerable.Empty<UserDto>();
            }

            var users = await _userRepository.SearchByNameAsync(keyword);

            return _mapper.Map<IEnumerable<UserDto>>(users);
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
            var patient = await _patientRepository.GetPatientByUserIdAsync(id);

            if (user == null) throw new ArgumentException("Không tìm thấy người dùng");

            return new UserBasicInfoDto
            {
                Id = user.Id,
                username = user.UserName,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                identificationNumber = user.IdentificationNumber,
                imageURL = user.AvatarUrl,
                dob = user.DateOfBirth,
                address = user.Address,
                Allergies = patient?.Allergies,
                MedicalHistory = patient?.MedicalHistory,
                MedicalRecordNumber = patient?.MedicalRecordNumber,
                EmergencyContactName = patient?.EmergencyContactName,
                EmergencyContactPhone = patient?.EmergencyContactPhone,
                bloodTypeCode = patient?.BloodTypeCode

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

        public async Task<UserDto> AdminResetPasswordAsync(Guid userId, string newPassword)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;


            await _userRepository.UpdateAsync(user);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<User?> GetUserAsync(Guid userId)
        {
            return await _userRepository.GetByIdAsync(userId);
        }

    }
}