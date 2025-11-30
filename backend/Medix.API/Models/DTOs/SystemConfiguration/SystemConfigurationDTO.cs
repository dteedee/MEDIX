namespace Medix.API.Models.DTOs.SystemConfiguration
{
    public class SystemConfigurationRequest
    {
        public string ConfigKey { get; set; } = null!;
        public string ConfigValue { get; set; } = null!;
        public string DataType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public bool IsActive { get; set; } = true;
    }
    public class SystemConfigurationResponse
    {
        public string ConfigKey { get; set; } = null!;
        public string ConfigValue { get; set; } = null!;
        public string DataType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }

    }

    public class UpdateConfigurationValueRequest
    {
        public string Value { get; set; } = null!;
    }

    public class EmailServerSettingsDto
    {
        public bool Enabled { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = "Medix Notifications";
        public string Password { get; set; } = string.Empty;
        public bool HasPassword => !string.IsNullOrEmpty(Password);
    }

    public class UpdateEmailServerSettingsRequest
    {
        public bool Enabled { get; set; }
        public string? Username { get; set; }
        public string? FromEmail { get; set; }
        public string? FromName { get; set; }
        public string? Password { get; set; }
    }

    public class EmailTemplateDto
    {
        public string TemplateKey { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string? Description { get; set; }
        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;
    }

    public class UpdateEmailTemplateRequest
    {
        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;
    }

}
