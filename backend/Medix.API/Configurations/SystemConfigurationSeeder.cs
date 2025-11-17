using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Constants;
using Medix.API.Models.Entities;

namespace Medix.API.Configurations
{
    public class SystemConfigurationSeeder
    {
        private readonly ISystemConfigurationRepository _repo;
        private readonly ILogger<SystemConfigurationSeeder> _logger;

        public SystemConfigurationSeeder(
            ISystemConfigurationRepository repo,
            ILogger<SystemConfigurationSeeder> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            foreach (var template in SystemConfigurationDefaults.All)
            {
                var existing = await _repo.GetByKeyAsync(template.ConfigKey);
                if (existing != null) continue;

                var config = new SystemConfiguration
                {
                    ConfigKey = template.ConfigKey,
                    ConfigValue = template.ConfigValue,
                    DataType = template.DataType,
                    Category = template.Category,
                    Description = template.Description,
                    MinValue = template.MinValue,
                    MaxValue = template.MaxValue,
                    IsActive = template.IsActive,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system"
                };

                await _repo.AddAsync(config);
                _logger.LogInformation("Seeded default configuration {ConfigKey}", config.ConfigKey);
            }
        }
    }
}

