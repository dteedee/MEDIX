namespace Medix.API.Application.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body);
        Task<bool> SendVerificationCodeAsync(string email, string code);
        Task SendPasswordResetEmailAsync(string email, string resetToken);
        Task SendEmailVerificationAsync(string email, string verificationToken);
    }
}

