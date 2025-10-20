using Medix.API.Business.Interfaces.Community;
using Microsoft.Extensions.Configuration;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace Medix.API.Business.Services.Community
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
            var frontendBaseUrl = _configuration["PasswordReset:FrontendBaseUrl"] ?? "https://localhost:3000";
            var resetLink = $"{frontendBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(email)}";

            var subject = "Đặt lại mật khẩu Medix";
            var body = $@"
                <h2>Yêu cầu đặt lại mật khẩu</h2>
                <p>Bạn hoặc ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản: <strong>{System.Net.WebUtility.HtmlEncode(email)}</strong></p>
                <p>Nhấp vào liên kết sau để đặt lại mật khẩu của bạn:</p>
                <p><a href=""{resetLink}"">Đặt lại mật khẩu</a></p>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            ";

            var sent = await SendEmailAsync(email, subject, body);
            if (!sent)
            {
                _logger.LogWarning($"Failed to send password reset email to {email}. Reset link: {resetLink}");
            }
            else
            {
                _logger.LogInformation($"Password reset email sent to {email}.");
            }
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
                
                // Check if email settings are configured
                if (string.IsNullOrEmpty(emailSettings["SMTPServer"]) || 
                    string.IsNullOrEmpty(emailSettings["Username"]) || 
                    string.IsNullOrEmpty(emailSettings["Password"]))
                {
                    Console.WriteLine("Email settings not configured properly");
                    return false;
                }

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

                Console.WriteLine($"Email sent successfully to {to}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email to {to}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string email, string code)
        {
            var subject = "Mã xác nhận đăng ký hệ thống Medix";
            var body = $@"
                <h2>Xác nhận đăng ký tài khoản</h2>
                <p>Mã xác nhận của bạn là: <strong>{code}</strong></p>
                <p>Mã này sẽ hết hạn sau 10 phút.</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ của Medix!</p>
            ";

            return await SendEmailAsync(email, subject, body);
        }

        public async Task<bool> SendForgotPasswordCodeAsync(string email, string code)
        {
            var subject = "Mã xác nhận đặt lại mật khẩu - Medix";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2c3e50;'>Đặt lại mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Medix của mình.</p>
                    <p>Mã xác nhận của bạn là:</p>
                    <div style='background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;'>
                        <h1 style='color: #3498db; font-size: 32px; margin: 0; letter-spacing: 4px;'>{code}</h1>
                    </div>
                    <p><strong>Lưu ý:</strong></p>
                    <ul>
                        <li>Mã này sẽ hết hạn sau 10 phút</li>
                        <li>Chỉ sử dụng mã này một lần</li>
                        <li>Không chia sẻ mã này với bất kỳ ai</li>
                    </ul>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                    <p style='color: #7f8c8d; font-size: 12px;'>Email này được gửi tự động từ hệ thống Medix. Vui lòng không trả lời email này.</p>
                </div>
            ";

            return await SendEmailAsync(email, subject, body);
        }
    }
}

