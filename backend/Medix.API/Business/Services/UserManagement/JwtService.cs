using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.UserManagement
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateAccessToken(User user, IList<string> roles)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

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

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"])),
                signingCredentials: credentials
            );

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
                // Return a stable hashcode-like int if an int is required, but better to change signature.
                // Keeping signature to avoid breaking callers.
                return BitConverter.ToInt32(userIdAsGuid.ToByteArray(), 0);
            }
            return 0;
        }
    }
}
