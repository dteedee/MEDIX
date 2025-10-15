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
        private readonly IEmailService _emailService;

        public AuthService(IUserRepository userRepository, IJwtService jwtService, IEmailService emailService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _emailService = emailService;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userRepository.GetByEmailAsync(loginRequest.Email);
            
            if (user != null && BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
            {
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

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest)
        {
            var user = await _userRepository.GetByEmailAsync(forgotPasswordRequest.Email);
            if (user == null)
            {
                // Do not reveal existence; still return true
                return true;
            }

            var token = _jwtService.GeneratePasswordResetToken(user.Email);
            await _emailService.SendPasswordResetEmailAsync(user.Email, token);
            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest)
        {
            var isValid = _jwtService.ValidatePasswordResetToken(resetPasswordRequest.Token, resetPasswordRequest.Email);
            if (!isValid)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Token", new[] { "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" } }
                });
            }

            var user = await _userRepository.GetByEmailAsync(resetPasswordRequest.Email);
            if (user == null)
            {
                // Avoid user enumeration
                return true;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(resetPasswordRequest.Password);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto changePasswordRequest)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            var currentOk = BCrypt.Net.BCrypt.Verify(changePasswordRequest.CurrentPassword, user.PasswordHash);
            if (!currentOk)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CurrentPassword", new[] { "Mật khẩu hiện tại không đúng" } }
                });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordRequest.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<bool> LogoutAsync(Guid userId)
        {
            // Simple logout implementation
            await Task.Delay(1);
            return true;
        }
    }
}