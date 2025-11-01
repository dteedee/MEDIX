namespace Medix.API.Business.Interfaces.Community
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string body);
        Task<bool> SendVerificationCodeAsync(string email, string code);
        Task<bool> SendForgotPasswordCodeAsync(string email, string code);
        Task SendPasswordResetEmailAsync(string email, string resetToken); // This seems to be a duplicate declaration.
        Task SendEmailVerificationAsync(string email, string verificationToken); // This seems to be a duplicate declaration.
        Task<bool> SendNewUserPasswordAsync(string email, string username, string password);
    }
}
