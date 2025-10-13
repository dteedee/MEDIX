using Medix.API.Data.Models;

namespace Medix.API.Application.Services
{
    public interface IJwtService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        bool ValidateRefreshToken(string refreshToken);
        int GetUserIdFromToken(string token);
    }
}

