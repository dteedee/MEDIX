using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.UserManagement
{
    public interface IJwtService
    {
        string GenerateAccessToken(User user, IList<string> roles);
        string GenerateRefreshToken();
        bool ValidateRefreshToken(string refreshToken);
        int GetUserIdFromToken(string token);
        string GeneratePasswordResetToken(string email);
        bool ValidatePasswordResetToken(string token, string email);
    }
}

