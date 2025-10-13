using Medix.API.Application.Services;

namespace Medix.API.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
            _logger.LogInformation($"Password reset email would be sent to {email} with token: {resetToken}");
            
            // For development purposes, we'll just log the reset link
            var resetLink = $"https://localhost:3000/reset-password?token={resetToken}&email={email}";
            _logger.LogInformation($"Reset link: {resetLink}");
            
            await Task.CompletedTask;
        }

        public async Task SendEmailVerificationAsync(string email, string verificationToken)
        {
            // In a real application, you would integrate with an email service
            _logger.LogInformation($"Email verification would be sent to {email} with token: {verificationToken}");
            
            // For development purposes, we'll just log the verification link
            var verificationLink = $"https://localhost:3000/verify-email?token={verificationToken}&email={email}";
            _logger.LogInformation($"Verification link: {verificationLink}");
            
            await Task.CompletedTask;
        }
    }
}

