using System.Collections.Generic;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Configurations
{
    public class SystemConfigurationSeeder
    {
        private readonly ISystemConfigurationRepository _repo;
        private readonly ILogger<SystemConfigurationSeeder> _logger;

        private static readonly List<SystemConfiguration> DefaultMaintenanceConfigs = new()
        {
            new SystemConfiguration
            {
                ConfigKey = "MAINTENANCE_MODE",
                ConfigValue = "false",
                DataType = "bool",
                Category = "SYSTEM",
                Description = "Bật hoặc tắt chế độ bảo trì cho toàn hệ thống",
                IsActive = true
            },
            new SystemConfiguration
            {
                ConfigKey = "MAINTENANCE_MESSAGE",
                ConfigValue = "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
                DataType = "string",
                Category = "SYSTEM",
                Description = "Thông báo hiển thị khi bật chế độ bảo trì",
                IsActive = true
            },
            new SystemConfiguration
            {
                ConfigKey = "MAINTENANCE_SCHEDULE",
                ConfigValue = "",
                DataType = "string",
                Category = "SYSTEM",
                Description = "Thời gian dự kiến kết thúc bảo trì (ISO 8601)",
                IsActive = true
            }
        };

        public SystemConfigurationSeeder(
            ISystemConfigurationRepository repo,
            ILogger<SystemConfigurationSeeder> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            foreach (var config in DefaultMaintenanceConfigs)
            {
                var existing = await _repo.GetByKeyAsync(config.ConfigKey);
                if (existing != null) continue;

                config.UpdatedAt = DateTime.UtcNow;
                config.UpdatedBy = "system";
                await _repo.AddAsync(config);
                _logger.LogInformation("Seeded default configuration {ConfigKey}", config.ConfigKey);
            }
        }
    }
}

