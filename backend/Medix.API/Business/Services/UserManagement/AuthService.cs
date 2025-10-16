using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Business.Services.UserManagement
{
	public class AuthService : IAuthService
	{
		private readonly IUserRepository _userRepository;
		private readonly IJwtService _jwtService;
		private readonly IEmailService _emailService;
		private readonly IUserRoleRepository _userRoleRepository;
		private readonly DataAccess.MedixContext _context;

		public AuthService(
			IUserRepository userRepository,
			IJwtService jwtService,
			IEmailService emailService,
			IUserRoleRepository userRoleRepository,
			DataAccess.MedixContext context)
		{
			_userRepository = userRepository;
			_jwtService = jwtService;
			_emailService = emailService;
			_userRoleRepository = userRoleRepository;
			_context = context;
		}

		public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
		{
			var user = await _userRepository.GetByEmailAsync(loginRequest.Email);

			if (user != null && BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
			{
				var accessToken = _jwtService.GenerateAccessToken(user, new List<string> { user.Role });
				var refreshToken = _jwtService.GenerateRefreshToken();

				// Lưu refresh token vào DB
				var refreshEntity = new RefreshToken
				{
					Id = Guid.NewGuid(),
					UserId = user.Id,
					Token = refreshToken,
					CreatedAt = DateTime.UtcNow,
					ExpiresAt = DateTime.UtcNow.AddDays(7)
				};
				_context.RefreshTokens.Add(refreshEntity);
				await _context.SaveChangesAsync();

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

			// Lưu refresh token
			var refreshEntity = new RefreshToken
			{
				Id = Guid.NewGuid(),
				UserId = user.Id,
				Token = refreshToken,
				CreatedAt = DateTime.UtcNow,
				ExpiresAt = DateTime.UtcNow.AddDays(7)
			};
			_context.RefreshTokens.Add(refreshEntity);
			await _context.SaveChangesAsync();

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

		public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest)
		{
			// Tìm token trong DB
			var storedToken = await _context.RefreshTokens
				.Include(r => r.User)
				.FirstOrDefaultAsync(r => r.Token == refreshTokenRequest.RefreshToken);

			if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
			{
				throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
			}

			// Sinh access token mới
			var user = storedToken.User;
			var newAccessToken = _jwtService.GenerateAccessToken(user, new List<string> { user.Role });
			var newRefreshToken = _jwtService.GenerateRefreshToken();

			// Xóa token cũ (tùy chọn: giữ nếu bạn muốn đa thiết bị)
			_context.RefreshTokens.Remove(storedToken);

			// Lưu token mới
			var newTokenEntity = new RefreshToken
			{
				Id = Guid.NewGuid(),
				UserId = user.Id,
				Token = newRefreshToken,
				CreatedAt = DateTime.UtcNow,
				ExpiresAt = DateTime.UtcNow.AddDays(7)
			};

			_context.RefreshTokens.Add(newTokenEntity);
			await _context.SaveChangesAsync();

			return new AuthResponseDto
			{
				AccessToken = newAccessToken,
				RefreshToken = newRefreshToken,
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

		public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest)
		{
			var user = await _userRepository.GetByEmailAsync(forgotPasswordRequest.Email);
			if (user == null) return true;

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
			if (user == null) return true;

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

		public async Task<AuthResponseDto> LoginWithGoogleAsync(GoogleLoginRequestDto request)
		{
			var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
			var email = payload.Email;
			var fullName = payload.Name ?? payload.Email;

			var existingUser = await _userRepository.GetByEmailAsync(email);
			if (existingUser == null)
			{
				var newUser = new User
				{
					Id = Guid.NewGuid(),
					UserName = email,
					NormalizedUserName = email.ToUpperInvariant(),
					Email = email,
					NormalizedEmail = email.ToUpperInvariant(),
					PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
					FullName = fullName,
					EmailConfirmed = true,
					Status = 1,
					IsProfileCompleted = false,
					LockoutEnabled = false,
					AccessFailedCount = 0,
					CreatedAt = DateTime.UtcNow,
					UpdatedAt = DateTime.UtcNow
				};

				await _userRepository.CreateAsync(newUser);

				var patientRole = await _context.RefRoles.FirstOrDefaultAsync(r => r.Code == "Patient");
				if (patientRole == null)
				{
					patientRole = new Models.Enums.RefRole
					{
						Code = "Patient",
						DisplayName = "Bệnh nhân",
						Description = "Người dùng bệnh nhân",
						IsActive = true,
						CreatedAt = DateTime.UtcNow
					};
					_context.RefRoles.Add(patientRole);
					await _context.SaveChangesAsync();
				}

				await _userRoleRepository.AssignRole("Patient", newUser.Id);
				existingUser = newUser;
				existingUser.Role = "Patient";
			}
			else if (string.IsNullOrEmpty(existingUser.Role))
			{
				existingUser.Role = existingUser.UserRoles.FirstOrDefault()?.RoleCode ?? "Patient";
			}

			var accessToken = _jwtService.GenerateAccessToken(existingUser, new List<string> { existingUser.Role });
			var refreshToken = _jwtService.GenerateRefreshToken();

			// Lưu refresh token
			var refreshEntity = new RefreshToken
			{
				Id = Guid.NewGuid(),
				UserId = existingUser.Id,
				Token = refreshToken,
				CreatedAt = DateTime.UtcNow,
				ExpiresAt = DateTime.UtcNow.AddDays(7)
			};
			_context.RefreshTokens.Add(refreshEntity);
			await _context.SaveChangesAsync();

			return new AuthResponseDto
			{
				AccessToken = accessToken,
				RefreshToken = refreshToken,
				ExpiresAt = DateTime.UtcNow.AddHours(1),
				User = new UserDto
				{
					Id = existingUser.Id,
					Email = existingUser.Email,
					FullName = existingUser.FullName,
					Role = existingUser.Role,
					EmailConfirmed = true,
					CreatedAt = existingUser.CreatedAt
				}
			};
		}

		public async Task<bool> LogoutAsync(Guid userId)
		{
			// Xóa tất cả refresh token của user (tùy chọn)
			var tokens = _context.RefreshTokens.Where(r => r.UserId == userId);
			_context.RefreshTokens.RemoveRange(tokens);
			await _context.SaveChangesAsync();
			return true;
		}
	}
}
