using System.Collections.Concurrent;

namespace Medix.API.Business.Services.UserManagement
{
    public class OTPManager
    {
        private static readonly ConcurrentDictionary<string, OTPData> _otpStorage = new();
        private static readonly Timer _cleanupTimer;

        static OTPManager()
        {
            // Cleanup expired OTPs every 5 minutes
            _cleanupTimer = new Timer(CleanupExpiredOTPs, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
        }

        public class OTPData
        {
            public string Code { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
            public bool IsUsed { get; set; }
        }

        public static string GenerateOTP(string email)
        {
            // Generate 6-digit random code
            var random = new Random();
            var code = random.Next(100000, 999999).ToString();

            // Remove any existing OTP for this email
            _otpStorage.TryRemove(email, out _);

            // Store new OTP
            var otpData = new OTPData
            {
                Code = code,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10), // 10 minutes expiry
                IsUsed = false
            };

            _otpStorage.TryAdd(email, otpData);

            Console.WriteLine($"=== OTP GENERATED FOR {email}: {code} (Expires: {otpData.ExpiresAt:HH:mm:ss}) ===");
            return code;
        }

        public static bool VerifyOTP(string email, string code)
        {
            if (!_otpStorage.TryGetValue(email, out var otpData))
            {
                Console.WriteLine($"=== OTP VERIFICATION FAILED FOR {email}: No OTP found ===");
                return false;
            }

            // Check if OTP is expired
            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                Console.WriteLine($"=== OTP VERIFICATION FAILED FOR {email}: OTP expired (Expired at: {otpData.ExpiresAt:HH:mm:ss}) ===");
                _otpStorage.TryRemove(email, out _);
                return false;
            }

            // Check if OTP is already used
            if (otpData.IsUsed)
            {
                Console.WriteLine($"=== OTP VERIFICATION FAILED FOR {email}: OTP already used ===");
                return false;
            }

            // Check if code matches
            if (otpData.Code != code)
            {
                Console.WriteLine($"=== OTP VERIFICATION FAILED FOR {email}: Invalid code (Expected: {otpData.Code}, Got: {code}) ===");
                return false;
            }

            Console.WriteLine($"=== OTP VERIFICATION SUCCESS FOR {email}: {code} ===");
            return true;
        }

        public static bool MarkOTPAsUsed(string email)
        {
            if (!_otpStorage.TryGetValue(email, out var otpData))
            {
                return false;
            }

            otpData.IsUsed = true;
            Console.WriteLine($"=== OTP MARKED AS USED FOR {email}: {otpData.Code} ===");
            return true;
        }

        public static void InvalidateOTP(string email)
        {
            if (_otpStorage.TryRemove(email, out var otpData))
            {
                Console.WriteLine($"=== OTP INVALIDATED FOR {email}: {otpData.Code} ===");
            }
        }

        public static bool HasValidOTP(string email)
        {
            if (!_otpStorage.TryGetValue(email, out var otpData))
            {
                return false;
            }

            return DateTime.UtcNow <= otpData.ExpiresAt && !otpData.IsUsed;
        }

        public static int GetRemainingMinutes(string email)
        {
            if (!_otpStorage.TryGetValue(email, out var otpData))
            {
                return 0;
            }

            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                return 0;
            }

            return (int)Math.Ceiling((otpData.ExpiresAt - DateTime.UtcNow).TotalMinutes);
        }

        private static void CleanupExpiredOTPs(object? state)
        {
            var expiredEmails = _otpStorage
                .Where(kvp => DateTime.UtcNow > kvp.Value.ExpiresAt)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var email in expiredEmails)
            {
                _otpStorage.TryRemove(email, out _);
            }

            if (expiredEmails.Any())
            {
                Console.WriteLine($"=== CLEANUP: Removed {expiredEmails.Count} expired OTPs ===");
            }
        }

        public static void PrintOTPStatus()
        {
            Console.WriteLine("=== CURRENT OTP STATUS ===");
            foreach (var kvp in _otpStorage)
            {
                var otp = kvp.Value;
                var status = DateTime.UtcNow > otp.ExpiresAt ? "EXPIRED" : 
                           otp.IsUsed ? "USED" : "ACTIVE";
                var remaining = GetRemainingMinutes(kvp.Key);
                Console.WriteLine($"Email: {kvp.Key}, Code: {otp.Code}, Status: {status}, Remaining: {remaining}min");
            }
            Console.WriteLine("=== END OTP STATUS ===");
        }
    }
}
