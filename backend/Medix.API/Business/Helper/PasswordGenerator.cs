namespace Medix.API.Business.Helper
{
    using System;
    using System.Linq;
    using System.Text;

    public class PasswordGenerator
    {
        private const int DefaultLength = 12;
        private static readonly char[] Uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray();
        private static readonly char[] Lowercase = "abcdefghijklmnopqrstuvwxyz".ToCharArray();
        private static readonly char[] Digits = "0123456789".ToCharArray();
        private static readonly char[] Special = "!@#$%^&*()-_=+[]{}".ToCharArray();

        private static readonly char[] AllChars = Uppercase.Concat(Lowercase).Concat(Digits).Concat(Special).ToArray();

        public static string Generate(int length = DefaultLength)
        {
            if (length < 8)
                throw new ArgumentException("Password length must be at least 8 characters.");

            var random = new Random();
            var password = new StringBuilder();

            password.Append(Uppercase[random.Next(Uppercase.Length)]);
            password.Append(Lowercase[random.Next(Lowercase.Length)]);
            password.Append(Digits[random.Next(Digits.Length)]);
            password.Append(Special[random.Next(Special.Length)]);

            for (int i = password.Length; i < length; i++)
            {
                password.Append(AllChars[random.Next(AllChars.Length)]);
            }

            return new string(password.ToString().OrderBy(_ => random.Next()).ToArray());
        }
    }

}
