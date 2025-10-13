using Medix.API.Application.DTOs.Auth;

namespace Medix.API.Application.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest);
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest);
        Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest);
        Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest);
        Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto changePasswordRequest);
        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest);
        Task<bool> LogoutAsync(Guid userId);
    }
}
