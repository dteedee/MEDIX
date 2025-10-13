
using Medix.API.Application.Services;
using Microsoft.Extensions.Configuration;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;


namespace Medix.API.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
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

        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var emailSettings = _configuration.GetSection("EmailSettings");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Medix", emailSettings["FromEmail"]));
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = body };

                using var client = new SmtpClient();
                await client.ConnectAsync(emailSettings["SMTPServer"],
                    int.Parse(emailSettings["Port"]), SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(emailSettings["Username"], emailSettings["Password"]);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string email, string code)
        {
            var subject = "Mã xác nhận đăng ký Medix";
            var body = $@"
                <h2>Xác nhận đăng ký tài khoản</h2>
                <p>Mã xác nhận của bạn là: <strong>{code}</strong></p>
                <p>Mã này sẽ hết hạn sau 15 phút.</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ Medix!</p>
            ";

            return await SendEmailAsync(email, subject, body);
        }
    }
}

