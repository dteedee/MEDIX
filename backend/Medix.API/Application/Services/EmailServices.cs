using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace Medix.API.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body);
        Task<bool> SendVerificationCodeAsync(string email, string code);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
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
