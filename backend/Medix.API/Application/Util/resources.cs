namespace Medix.API.Utils
{
    public class resources
    {
        public static string GenerateConfirmationCode()
        {
            var random = new Random();
            return random.Next(100000, 1000000).ToString();
        }
    }
}
