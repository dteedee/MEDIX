using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Models.Constants;
using Medix.API.Models.DTOs.SystemConfiguration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Medix.API.Business.Services.Community
{
    public class EmailService : IEmailService
    {
        private const string DefaultSmtpServer = "smtp.gmail.com";
        private const int DefaultSmtpPort = 587;
        private const string PasswordResetTemplateKey = "PASSWORD_RESET_LINK";
        private const string ForgotPasswordTemplateKey = "FORGOT_PASSWORD_CODE";
        private const string NewUserTemplateKey = "NEW_USER_WELCOME";
        private const string AccountVerificationTemplateKey = "ACCOUNT_VERIFICATION";

        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly ISystemConfigurationService _systemConfigurationService;

        public EmailService(
            ILogger<EmailService> logger,
            IConfiguration configuration,
            ISystemConfigurationService systemConfigurationService)
        {
            _logger = logger;
            _configuration = configuration;
            _systemConfigurationService = systemConfigurationService;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            var frontendBaseUrl = _configuration["PasswordReset:FrontendBaseUrl"] ?? "https://localhost:3000";
            var resetLink =
                $"{frontendBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(email)}";

            var tokens = new Dictionary<string, string>
            {
                ["email"] = WebUtility.HtmlEncode(email),
                ["reset_link"] = resetLink
            };

            var sent = await SendTemplateEmailAsync(email, PasswordResetTemplateKey, tokens);
            if (!sent)
            {
                _logger.LogWarning("Failed to send password reset email to {Email}. Reset link: {Link}", email, resetLink);
            }
            else
            {
                _logger.LogInformation("Password reset email sent to {Email}", email);
            }
        }

        public async Task SendEmailVerificationAsync(string email, string verificationToken)
        {
            var frontendBaseUrl = _configuration["PasswordReset:FrontendBaseUrl"] ?? "https://localhost:3000";
            var verificationLink =
                $"{frontendBaseUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(verificationToken)}&email={Uri.EscapeDataString(email)}";

            var tokens = new Dictionary<string, string>
            {
                ["email"] = WebUtility.HtmlEncode(email),
                ["verification_link"] = verificationLink
            };

            var sent = await SendTemplateEmailAsync(email, AccountVerificationTemplateKey, tokens);
            if (!sent)
            {
                _logger.LogWarning("Failed to send verification email to {Email}. Link: {Link}", email, verificationLink);
            }
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var settings = await LoadEmailInfrastructureAsync();

                if (!settings.Enabled)
                {
                    _logger.LogWarning("Email sending is disabled in system configuration.");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(settings.Username) ||
                    string.IsNullOrWhiteSpace(settings.Password))
                {
                    _logger.LogError("Email settings are incomplete. Unable to send email to {Recipient}", to);
                    return false;
                }

                var message = new MimeMessage();
                var fromName = string.IsNullOrWhiteSpace(settings.FromName) ? "Medix" : settings.FromName;
                var fromEmail = string.IsNullOrWhiteSpace(settings.FromEmail) ? settings.Username : settings.FromEmail;
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(MailboxAddress.Parse(to));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = body };

                using var client = new SmtpClient();
                _logger.LogInformation("Connecting to SMTP server {Server}:{Port} using STARTTLS...", DefaultSmtpServer, DefaultSmtpPort);
                await client.ConnectAsync(DefaultSmtpServer, DefaultSmtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(settings.Username, settings.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Recipient}", to);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Recipient}. Error: {ErrorMessage}", to, ex.Message);
                return false;
            }
        }

        public Task<bool> SendVerificationCodeAsync(string email, string code) => SendOtpEmailAsync(email, code);

        public Task<bool> SendForgotPasswordCodeAsync(string email, string code) => SendOtpEmailAsync(email, code);

        public async Task<bool> SendNewUserPasswordAsync(string email, string username, string password)
        {
            var frontendBaseUrl = _configuration["PasswordReset:FrontendBaseUrl"] ?? "http://localhost:5173";
            var loginLink = $"{frontendBaseUrl.TrimEnd('/')}/login";

            var tokens = new Dictionary<string, string>
            {
                ["username"] = WebUtility.HtmlEncode(username),
                ["email"] = WebUtility.HtmlEncode(email),
                ["temporary_password"] = WebUtility.HtmlEncode(password),
                ["login_link"] = loginLink
            };

            return await SendTemplateEmailAsync(email, NewUserTemplateKey, tokens);
        }

        private Task<bool> SendOtpEmailAsync(string email, string code)
        {
            var tokens = new Dictionary<string, string>
            {
                ["email"] = WebUtility.HtmlEncode(email),
                ["code"] = code,
                ["code_expire_minutes"] = "10"
            };

            return SendTemplateEmailAsync(email, ForgotPasswordTemplateKey, tokens);
        }

        private async Task<bool> SendTemplateEmailAsync(string recipient, string templateKey, IDictionary<string, string> tokens)
        {
            var metadata = SystemConfigurationDefaults.EmailTemplateMetadatas
                .FirstOrDefault(t => t.TemplateKey.Equals(templateKey, StringComparison.OrdinalIgnoreCase));

            var fallbackSubject = metadata != null
                ? SystemConfigurationDefaults.Find(metadata.SubjectKey)?.ConfigValue ?? "Thông báo từ Medix"
                : "Thông báo từ Medix";
            var fallbackBody = metadata != null
                ? SystemConfigurationDefaults.Find(metadata.BodyKey)?.ConfigValue ?? "<p>Xin chào,</p>"
                : "<p>Xin chào,</p>";

            var template = metadata != null
                ? await _systemConfigurationService.GetEmailTemplateAsync(metadata.TemplateKey)
                : null;

            var subject = MergeTemplate(template?.Subject ?? fallbackSubject, tokens);
            var body = MergeTemplate(template?.Body ?? fallbackBody, tokens);

            return await SendEmailAsync(recipient, subject, body);
        }

        private async Task<EmailServerSettingsDto> LoadEmailInfrastructureAsync()
        {
            var settings = await _systemConfigurationService.GetEmailServerSettingsAsync();
            var emailSection = _configuration.GetSection("EmailSettings");

            if (string.IsNullOrWhiteSpace(settings.Username))
            {
                settings.Username = emailSection["Username"] ?? settings.Username ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(settings.Password))
            {
                settings.Password = emailSection["Password"] ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(settings.FromEmail))
            {
                settings.FromEmail = emailSection["FromEmail"] ?? settings.Username;
            }

            if (string.IsNullOrWhiteSpace(settings.FromName))
            {
                settings.FromName = "Medix";
            }

            return settings;
        }

        private static string MergeTemplate(string template, IDictionary<string, string> tokens)
        {
            if (string.IsNullOrEmpty(template)) return string.Empty;

            var result = template;
            foreach (var token in tokens)
            {
                var pattern = $"{{{{\\s*{Regex.Escape(token.Key)}\\s*}}}}";
                result = Regex.Replace(result, pattern, token.Value, RegexOptions.IgnoreCase);
            }

            return result;
        }
    }
}
