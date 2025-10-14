using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.UserManagement
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IUserRoleRepository _userRoleRepository;

        public AuthService(IUserRepository userRepository, IJwtService jwtService, IUserRoleRepository userRoleRepository)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _userRoleRepository = userRoleRepository;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userRepository.GetByEmailAsync(loginRequest.Email);
            
            if (user != null && BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
            {
                var userRole = await _userRoleRepository.GetByUserIdAsync(user.Id);
                var accessToken = _jwtService.GenerateAccessToken(user, new List<string> { userRole.RoleCode });
                var refreshToken = _jwtService.GenerateRefreshToken();
            
                return new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FullName = user.FullName,
                        Role = user.Role,
                        EmailConfirmed = user.EmailConfirmed,
                        CreatedAt = user.CreatedAt
                    }
                };
            }

            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest)
        {
            var existingUser = await _userRepository.GetByEmailAsync(registerRequest.Email);
            if (existingUser != null)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Email", new[] { "Email đã được sử dụng" } }
                });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = registerRequest.Email,
                NormalizedUserName = registerRequest.Email.ToUpper(),
                Email = registerRequest.Email,
                NormalizedEmail = registerRequest.Email.ToUpper(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password),
                FullName = $"{registerRequest.FirstName} {registerRequest.LastName}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);

            var accessToken = _jwtService.GenerateAccessToken(user, new List<string> { user.Role });
            var refreshToken = _jwtService.GenerateRefreshToken();

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = user.CreatedAt
                }
            };
        }

        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest)
        {
            throw new NotImplementedException("Refresh token chưa được triển khai");
        }

        public Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest)
        {
            throw new NotImplementedException("Forgot password chưa được triển khai");
        }

        public Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest)
        {
            throw new NotImplementedException("Reset password chưa được triển khai");
        }

        public Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto changePasswordRequest)
        {
            throw new NotImplementedException("Change password chưa được triển khai");
        }

        public async Task<bool> LogoutAsync(Guid userId)
        {
            // Simple logout implementation
            await Task.Delay(1);
            return true;
        }
    }
}