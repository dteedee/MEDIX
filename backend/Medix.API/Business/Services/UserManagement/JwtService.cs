using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.Entities;
using Medix.API.Business.Interfaces;
using Medix.API.Business.Interfaces.Classification;

namespace Medix.API.Business.Services.UserManagement
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly ISystemConfigurationService _systemConfig;

        public JwtService(
            IConfiguration configuration,
            ISystemConfigurationService systemConfig)
        {
            _configuration = configuration;
            _systemConfig = systemConfig;
        }

        public string GenerateAccessToken(User user, IList<string> roles)
        {
            // 1. Lấy key
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 2. Claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("fullName", user.FullName)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // 3. Lấy expiry từ database
            var expiryMinutes = _systemConfig
                .GetIntValueAsync("JWT_EXPIRY_MINUTES")
                .GetAwaiter()
                .GetResult() ?? 30; 

            // 4. Tạo token
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            // 5. Xuất chuỗi token
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            return Guid.NewGuid().ToString();
        }

        public bool ValidateRefreshToken(string refreshToken)
        {
            return !string.IsNullOrEmpty(refreshToken) && Guid.TryParse(refreshToken, out _);
        }

        public int GetUserIdFromToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwt = tokenHandler.ReadJwtToken(token);
            var userIdClaim = jwt.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);

            if (Guid.TryParse(userIdClaim?.Value, out var userIdAsGuid))
            {
                return BitConverter.ToInt32(userIdAsGuid.ToByteArray(), 0);
            }
            return 0;
        }

        public string GeneratePasswordResetToken(string email)
        {
            var secret = _configuration["Jwt:Key"]!;
            var issuedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var payload = $"{email}|{issuedAt}";
            using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var sig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}|{sig}"));
            return token;
        }

        public bool ValidatePasswordResetToken(string token, string email)
        {
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(token));
                var parts = decoded.Split('|');
                if (parts.Length != 3) return false;
                var tokenEmail = parts[0];
                if (!string.Equals(tokenEmail, email, StringComparison.OrdinalIgnoreCase)) return false;
                if (!long.TryParse(parts[1], out var issuedAt)) return false;

                var secret = _configuration["Jwt:Key"]!;
                var payload = $"{tokenEmail}|{issuedAt}";
                using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secret));
                var expectedSig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
                var providedSig = parts[2];
                if (!CryptographicEquals(expectedSig, providedSig)) return false;

                var ttlMinutes = int.TryParse(_configuration["PasswordReset:ExpiryMinutes"], out var m) ? m : 30;
                var issuedAtDt = DateTimeOffset.FromUnixTimeSeconds(issuedAt);
                if (DateTimeOffset.UtcNow - issuedAtDt > TimeSpan.FromMinutes(ttlMinutes)) return false;

                return true;
            }
            catch
            {
                return false;
            }
        }

        private static bool CryptographicEquals(string a, string b)
        {
            var ba = Encoding.UTF8.GetBytes(a);
            var bb = Encoding.UTF8.GetBytes(b);
            if (ba.Length != bb.Length) return false;
            var diff = 0;
            for (int i = 0; i < ba.Length; i++) diff |= ba[i] ^ bb[i];
            return diff == 0;
        }
    }
}
