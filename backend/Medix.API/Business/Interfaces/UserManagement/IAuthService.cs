using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.UserManagement
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
