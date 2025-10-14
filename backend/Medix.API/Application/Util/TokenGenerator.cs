using System.Security.Cryptography;
using System.Text;

namespace Medix.API.Application.Util
{
    public static class TokenGenerator
    {
        public static string GenerateRandomToken(int numBytes = 32)
        {
            if (numBytes <= 0)
            {
                numBytes = 32;
            }

            Span<byte> buffer = stackalloc byte[numBytes];
            RandomNumberGenerator.Fill(buffer);

            // Base64Url encode (no padding, replace +/ with -_)
            var token = Convert.ToBase64String(buffer);
            token = token.TrimEnd('=')
                         .Replace('+', '-')
                         .Replace('/', '_');
            return token;
        }
    }
}



