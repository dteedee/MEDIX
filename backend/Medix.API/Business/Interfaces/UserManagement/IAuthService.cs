using Medix.API.Models.DTOs.Authen;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest);
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest);
        Task<AuthResponseDto> LoginWithGoogleAsync(GoogleLoginRequestDto request);
        Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto forgotPasswordRequest);
        Task<bool> ResetPasswordAsync(ResetPasswordRequestDto resetPasswordRequest);
        Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto changePasswordRequest);
        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest);
        Task<bool> LogoutAsync(Guid userId);
    }
}
