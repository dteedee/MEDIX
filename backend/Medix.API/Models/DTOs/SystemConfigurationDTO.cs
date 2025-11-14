namespace Medix.API.Models.DTOs
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
}
