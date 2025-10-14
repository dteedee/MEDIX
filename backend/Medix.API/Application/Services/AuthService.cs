using AutoMapper;
using Medix.API.Application.DTOs.Auth;
using Medix.API.Application.Exceptions;
using Medix.API.Application.Services;
using Medix.API.Application.Util;
using Medix.API.Data.Models;
using Medix.API.Data.Repositories;
using System.Data;

namespace Medix.API.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        
        // In-memory storage for password reset tokens only
        private static readonly Dictionary<string, PasswordResetInfo> _passwordResetTokens = new();

        public AuthService(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IJwtService jwtService,
            IEmailService emailService,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _jwtService = jwtService;
            _emailService = emailService;
            _mapper = mapper;
        }

        // Helper class for in-memory password reset storage
        private class PasswordResetInfo
        {
            public Guid UserId { get; set; }
            public DateTime ExpiresAt { get; set; }
            public bool IsUsed { get; set; }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var user = await _userRepository.GetByEmailAsync(loginRequest.Email);
            if (user == null || !PasswordHasher.VerifyPassword(loginRequest.Password, user.PasswordHash))
            {
                throw new UnauthorizedException("Invalid email or password");
            }
			var roles = user.UserRoles.Select(ur => ur.RoleCode).ToList();

			var accessToken = _jwtService.GenerateAccessToken(user, roles);
			var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token to database
            var refreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            await _refreshTokenRepository.CreateAsync(refreshTokenEntity);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = _mapper.Map<UserDto>(user)
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest)
        {
            if (await _userRepository.ExistsByEmailAsync(registerRequest.Email))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Email", new[] { "Email already exists" } }
                });
            }

            var user = _mapper.Map<User>(registerRequest);
            user.PasswordHash = PasswordHasher.HashPassword(registerRequest.Password);

            var createdUser = await _userRepository.CreateAsync(user);
    var roles = createdUser.UserRoles.Select(ur => ur.RoleCode).ToList();

    var accessToken = _jwtService.GenerateAccessToken(createdUser, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Save refresh token to database
            var refreshTokenEntity = new RefreshToken
            {
                UserId = createdUser.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            await _refreshTokenRepository.CreateAsync(refreshTokenEntity);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = _mapper.Map<UserDto>(createdUser)
            };
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest)
        {
            var user = await _userRepository.GetByEmailAsync(forgotPasswordRequest.Email);
            if (user == null)
            {
                // Don't reveal if email exists or not for security
                return true;
            }

            var resetToken = TokenGenerator.GenerateRandomToken();
            
            // Save password reset token in memory
            _passwordResetTokens[resetToken] = new PasswordResetInfo
            {
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                IsUsed = false
            };

            await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken);

            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest)
        {
            if (!_passwordResetTokens.TryGetValue(resetPasswordRequest.Token, out var passwordReset))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Token", new[] { "Invalid or expired reset token" } }
                });
            }

            if (passwordReset.IsUsed || passwordReset.ExpiresAt < DateTime.UtcNow)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Token", new[] { "Invalid or expired reset token" } }
                });
            }

            var user = await _userRepository.GetByEmailAsync(resetPasswordRequest.Email);
            if (user == null || user.Id != passwordReset.UserId)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Email", new[] { "Invalid email for this reset token" } }
                });
            }

            user.PasswordHash = PasswordHasher.HashPassword(resetPasswordRequest.Password);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            // Mark token as used
            passwordReset.IsUsed = true;

            return true;
        }

        public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto changePasswordRequest)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            if (!PasswordHasher.VerifyPassword(changePasswordRequest.CurrentPassword, user.PasswordHash))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CurrentPassword", new[] { "Current password is incorrect" } }
                });
            }

            user.PasswordHash = PasswordHasher.HashPassword(changePasswordRequest.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return true;
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest)
        {
            var refreshToken = await _refreshTokenRepository.GetByTokenAsync(refreshTokenRequest.RefreshToken);
            if (refreshToken == null || refreshToken.ExpiresAt < DateTime.UtcNow)
            {
                throw new UnauthorizedException("Invalid or expired refresh token");
            }

            var user = await _userRepository.GetByIdAsync(refreshToken.UserId);
            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            // Revoke old refresh token
            await _refreshTokenRepository.RevokeTokenAsync(refreshTokenRequest.RefreshToken);
			var roles = user.UserRoles.Select(ur => ur.RoleCode).ToList();
			// Generate new tokens
			var accessToken = _jwtService.GenerateAccessToken(user, roles);
			var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Save new refresh token to database
            var newRefreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
            await _refreshTokenRepository.CreateAsync(newRefreshTokenEntity);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = _mapper.Map<UserDto>(user)
            };
        }

        public async Task<bool> LogoutAsync(Guid userId)
        {
            // Revoke all refresh tokens for this user
            await _refreshTokenRepository.RevokeAllUserTokensAsync(userId);
            return true;
        }
    }
}
