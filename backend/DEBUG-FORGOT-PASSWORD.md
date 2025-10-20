# Debug Forgot Password Feature

## 🔍 Steps to Debug

### 1. Check Backend Logs
When testing forgot password, check the backend console for these logs:

```
Error in ForgotPasswordAsync: [error message]
Stack trace: [stack trace]
```

### 2. Check Email Settings
Verify in `appsettings.json`:
```json
{
  "EmailSettings": {
    "SMTPServer": "smtp.gmail.com",
    "Port": 587,
    "EnableSSL": true,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "your-email@gmail.com"
  }
}
```

### 3. Test Email Service Directly
You can test the email service by calling the API directly:

```bash
curl -X POST "http://localhost:5123/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 4. Check Database
Verify that the EmailVerificationCode table exists and has the correct structure:

```sql
SELECT * FROM EmailVerificationCodes WHERE Email = 'test@example.com'
```

### 5. Common Issues

#### Gmail App Password
- Make sure you're using an App Password, not your regular Gmail password
- Enable 2-factor authentication on Gmail
- Generate App Password in Google Account settings

#### SMTP Settings
- Port 587 for TLS
- Port 465 for SSL
- Make sure firewall allows outbound connections

#### Database Connection
- Verify connection string in appsettings.json
- Make sure database is running
- Check if EmailVerificationCodes table exists

## 🚀 Quick Fix

If email is not working, you can temporarily modify the AuthService to always return success:

```csharp
public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request)
{
    try
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null) return true;

        // Generate 6-digit numeric code
        var code = new Random().Next(100000, 999999).ToString();

        // Save code in EmailVerificationCodes table
        var entity = new EmailVerificationCode
        {
            Email = request.Email,
            Code = code,
            ExpirationTime = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };

        _context.EmailVerificationCodes.Add(entity);
        await _context.SaveChangesAsync();

        // Log the code for testing (remove in production)
        Console.WriteLine($"FORGOT PASSWORD CODE FOR {request.Email}: {code}");

        return true;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in ForgotPasswordAsync: {ex.Message}");
        throw;
    }
}
```

This will log the code to console instead of sending email, useful for testing.
