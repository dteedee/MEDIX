namespace Medix.API.Application.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken);
        Task SendEmailVerificationAsync(string email, string verificationToken);
    }
}

