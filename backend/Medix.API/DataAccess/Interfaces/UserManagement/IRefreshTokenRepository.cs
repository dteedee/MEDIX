using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task<RefreshToken> CreateAsync(RefreshToken refreshToken);
        Task<bool> RevokeTokenAsync(string token);
        Task<bool> RevokeAllUserTokensAsync(Guid userId);
        Task<bool> DeleteExpiredTokensAsync();
    }
}

