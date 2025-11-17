using System.IO;
using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Medix.API.Business.Services.Classification
{
    public class SystemConfigurationService : ISystemConfigurationService
    {
        private readonly ISystemConfigurationRepository _repo;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);
        private readonly string _dbBackupFolder;
        private readonly string _connectionString;
        private readonly ILogger<SystemConfigurationService> _logger;

        public SystemConfigurationService(
            ISystemConfigurationRepository repo,
            IMapper mapper,
            IMemoryCache cache,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<SystemConfigurationService> logger)
        {
            _repo = repo;
            _mapper = mapper;
            _cache = cache;
            _logger = logger;

            _connectionString = configuration.GetConnectionString("MyCnn")
                ?? throw new InvalidOperationException("Connection string 'MyCnn' is missing.");

            _dbBackupFolder = Path.Combine(environment.WebRootPath ?? environment.ContentRootPath, "db-backups");
            if (!Directory.Exists(_dbBackupFolder))
            {
                Directory.CreateDirectory(_dbBackupFolder);
            }
        }


        public async Task<List<SystemConfigurationResponse>> GetAllAsync()
        {
            const string cacheKey = "SystemConfigs_All";

            if (!_cache.TryGetValue(cacheKey, out List<SystemConfigurationResponse>? configs))
            {
                var data = await _repo.GetAllAsync();
                configs = _mapper.Map<List<SystemConfigurationResponse>>(data);

                _cache.Set(cacheKey, configs, _cacheDuration);
            }

            return configs!;
        }

        public async Task<SystemConfigurationResponse?> GetByKeyAsync(string key)
        {
            string cacheKey = $"SystemConfig_{key}";

            if (!_cache.TryGetValue(cacheKey, out SystemConfigurationResponse? config))
            {
                var entity = await _repo.GetByKeyAsync(key);
                if (entity == null) return null;

                config = _mapper.Map<SystemConfigurationResponse>(entity);
                _cache.Set(cacheKey, config, _cacheDuration);
            }

            return config;
        }

        public async Task<T?> GetValueAsync<T>(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return default;
            return (T)Convert.ChangeType(config.ConfigValue, typeof(T));
        }

        public async Task AddAsync(SystemConfigurationRequest request, string updatedBy)
        {
            var entity = _mapper.Map<SystemConfiguration>(request);
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = updatedBy;

            await _repo.AddAsync(entity);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{request.ConfigKey}");
        }

        public async Task UpdateAsync(string key, object value, string updatedBy)
        {
            var entity = await _repo.GetByKeyAsync(key);
            if (entity == null)
                throw new KeyNotFoundException($"Configuration '{key}' not found.");
            if (entity.MinValue.HasValue || entity.MaxValue.HasValue)
            {
                if (decimal.TryParse(value.ToString(), out var numericValue))
                {
                    if (entity.MinValue.HasValue && numericValue < entity.MinValue)
                        throw new InvalidOperationException("Value is below allowed minimum.");

                    if (entity.MaxValue.HasValue && numericValue > entity.MaxValue)
                        throw new InvalidOperationException("Value exceeds allowed maximum.");
                }
            }

            entity.ConfigValue = value.ToString()!;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        public async Task DeleteAsync(string key)
        {
            await _repo.DeleteAsync(key);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        public async Task<int?> GetIntValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (int.TryParse(config.ConfigValue, out int val))
                return val;

            return null;
        }

        public async Task<bool?> GetBoolValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (bool.TryParse(config.ConfigValue, out bool val))
                return val;

            return null;
        }
        public async Task<PasswordPolicyDto> GetPasswordPolicyAsync()
        {
            return new PasswordPolicyDto
            {
                MinLength = await GetIntValueAsync("PASSWORD_MIN_LENGTH") ?? 8,
                MaxLength = await GetIntValueAsync("PASSWORD_MAX_LENGTH"),
                RequireUppercase = await GetBoolValueAsync("REQUIRE_UPPERCASE") ?? false,
                RequireLowercase = await GetBoolValueAsync("REQUIRE_LOWERCASE") ?? false,
                RequireDigit = await GetBoolValueAsync("REQUIRE_DIGIT") ?? false,
                RequireSpecial = await GetBoolValueAsync("REQUIRE_SPECIAL") ?? false,
            };
        }
        public async Task ValidatePasswordAsync(string password)
        {
            var policy = await GetPasswordPolicyAsync();

            // Only check minLength if it's greater than 0 (enabled)
            if (policy.MinLength > 0 && password.Length < policy.MinLength)
                throw new InvalidOperationException($"Mật khẩu phải dài ít nhất {policy.MinLength} ký tự.");

            if (policy.MaxLength.HasValue && password.Length > policy.MaxLength.Value)
                throw new InvalidOperationException($"Mật khẩu không được vượt quá {policy.MaxLength} ký tự.");

            if (policy.RequireUppercase && !password.Any(char.IsUpper))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).");

            if (policy.RequireLowercase && !password.Any(char.IsLower))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).");

            if (policy.RequireDigit && !password.Any(char.IsDigit))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ số (0-9).");

            if (policy.RequireSpecial && !password.Any(c => "!@#$%^&*()_+-=[]{}|;:,.<>/?".Contains(c)))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");
        }

        public async Task<string> BackupDatabaseAsync(string? backupName = null)
        {
            try
            {
                Directory.CreateDirectory(_dbBackupFolder);

                var baseName = string.IsNullOrWhiteSpace(backupName)
                    ? "db-backup"
                    : SanitizeFileName(backupName!);

                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var fileName = $"{baseName}_{timestamp}.bak";
                var filePath = Path.Combine(_dbBackupFolder, fileName);

                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var databaseName = connection.Database;
                var escapedPath = filePath.Replace("'", "''");
                var commandText =
                    $"BACKUP DATABASE [{databaseName}] TO DISK = '{escapedPath}' WITH INIT, SKIP, STATS = 5";

                await using (var command = new SqlCommand(commandText, connection))
                {
                    command.CommandTimeout = 0;
                    await command.ExecuteNonQueryAsync();
                }

                await CleanupOldDatabaseBackupsAsync();

                _logger.LogInformation("Database backup created at {Path}", filePath);
                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to backup database");
                throw;
            }
        }

        public Task<List<DatabaseBackupInfo>> GetDatabaseBackupFilesAsync()
        {
            Directory.CreateDirectory(_dbBackupFolder);

            var backups = Directory
                .GetFiles(_dbBackupFolder, "*.bak", SearchOption.TopDirectoryOnly)
                .Select(file =>
                {
                    var info = new FileInfo(file);
                    return new DatabaseBackupInfo
                    {
                        FileName = info.Name,
                        FilePath = file,
                        FileSize = info.Length,
                        FileSizeFormatted = FormatFileSize(info.Length),
                        CreatedAt = info.CreationTimeUtc
                    };
                })
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            return Task.FromResult(backups);
        }

        public Task<FileStream?> GetDatabaseBackupFileAsync(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return Task.FromResult<FileStream?>(null);
            }

            var sanitizedFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(_dbBackupFolder, sanitizedFileName);

            if (!File.Exists(filePath))
            {
                return Task.FromResult<FileStream?>(null);
            }

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult<FileStream?>(stream);
        }

        private async Task CleanupOldDatabaseBackupsAsync()
        {
            try
            {
                var retentionDays = await GetIntValueAsync("BACKUP_RETENTION_DAYS") ?? 30;
                var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

                foreach (var filePath in Directory.GetFiles(_dbBackupFolder, "*.bak"))
                {
                    var info = new FileInfo(filePath);
                    if (info.CreationTimeUtc < cutoff)
                    {
                        info.Delete();
                        _logger.LogInformation("Deleted old database backup {File}", info.FullName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup old database backups");
            }
        }

        private static string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        }

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            var order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }

    }
}
