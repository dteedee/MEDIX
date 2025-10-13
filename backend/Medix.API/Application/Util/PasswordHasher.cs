using System.Security.Cryptography;
using System.Text;

namespace Medix.API.Application.Util
{
    public static class PasswordHasher
    {
        public static string HashPassword(string password)
        {
            // For testing purposes, using base64 encoding
            // In production, use proper hashing like BCrypt or Argon2
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(password));
        }

        public static bool VerifyPassword(string password, string hashedPassword)
        {
            var hashedInput = HashPassword(password);
            return hashedInput == hashedPassword;
        }
    }
}
