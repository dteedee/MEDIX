using System.Text.Json;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Medix.API.Business.Services.Classification
{
    public class BackupService : IBackupService
    {
        private readonly ISystemConfigurationRepository _configRepo;
        private readonly ISystemConfigurationService _configService;
        private readonly ILogger<BackupService> _logger;
        private readonly string _backupDirectory;

        public BackupService(
            ISystemConfigurationRepository configRepo,
            ISystemConfigurationService configService,
            ILogger<BackupService> logger,
            IWebHostEnvironment environment)
        {
            _configRepo = configRepo;
            _configService = configService;
            _logger = logger;
            
            // Tạo thư mục backup trong wwwroot/backups
            _backupDirectory = Path.Combine(environment.WebRootPath ?? environment.ContentRootPath, "backups");
            if (!Directory.Exists(_backupDirectory))
            {
                Directory.CreateDirectory(_backupDirectory);
            }
        }

        public async Task<BackupRecordResponse> CreateBackupAsync(string? backupName = null, string? createdBy = null)
        {
            try
            {
                // Lấy tất cả SystemConfiguration
                var configs = await _configRepo.GetAllAsync();
                
                // Tạo tên file backup
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var fileName = backupName != null 
                    ? $"{SanitizeFileName(backupName)}_{timestamp}.json" 
                    : $"backup_{timestamp}.json";
                var filePath = Path.Combine(_backupDirectory, fileName);

                var backupId = Guid.NewGuid();
                var createdAt = DateTime.UtcNow;

                // Serialize và lưu file
                var backupData = new
                {
                    BackupId = backupId,
                    BackupName = backupName ?? $"Backup {createdAt:yyyy-MM-dd HH:mm:ss}",
                    CreatedAt = createdAt,
                    CreatedBy = createdBy ?? "system",
                    BackupType = createdBy != null ? "manual" : "automatic",
                    RecordCount = configs.Count,
                    Configurations = configs.Select(c => new
                    {
                        c.ConfigKey,
                        c.ConfigValue,
                        c.DataType,
                        c.Category,
                        c.Description,
                        c.MinValue,
                        c.MaxValue,
                        c.IsActive,
                        c.UpdatedAt,
                        c.UpdatedBy
                    }).ToList()
                };

                var json = JsonSerializer.Serialize(backupData, new JsonSerializerOptions 
                { 
                    WriteIndented = true,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                });

                await File.WriteAllTextAsync(filePath, json);

                // Lấy thông tin file
                var fileInfo = new FileInfo(filePath);

                _logger.LogInformation($"Backup created successfully: {backupId} - {fileName}");

                return new BackupRecordResponse
                {
                    Id = backupId,
                    BackupName = backupData.BackupName,
                    FilePath = filePath,
                    BackupType = backupData.BackupType,
                    FileSize = fileInfo.Length,
                    FileSizeFormatted = FormatFileSize(fileInfo.Length),
                    CreatedAt = createdAt,
                    CreatedBy = createdBy,
                    Status = "success",
                    RecordCount = configs.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating backup");
                throw;
            }
        }

        public async Task<List<BackupRecordResponse>> GetAllBackupsAsync()
        {
            try
            {
                var backups = new List<BackupRecordResponse>();

                if (!Directory.Exists(_backupDirectory))
                {
                    return backups;
                }

                var backupFiles = Directory.GetFiles(_backupDirectory, "*.json")
                    .OrderByDescending(f => new FileInfo(f).CreationTime)
                    .ToList();

                foreach (var filePath in backupFiles)
                {
                    try
                    {
                        var backup = await GetBackupInfoFromFileAsync(filePath);
                        if (backup != null)
                        {
                            backups.Add(backup);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error reading backup file: {filePath}");
                    }
                }

                return backups;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all backups");
                throw;
            }
        }

        public async Task<BackupRecordResponse?> GetBackupByIdAsync(Guid id)
        {
            try
            {
                if (!Directory.Exists(_backupDirectory))
                {
                    return null;
                }

                var backupFiles = Directory.GetFiles(_backupDirectory, "*.json");

                foreach (var filePath in backupFiles)
                {
                    try
                    {
                        var backup = await GetBackupInfoFromFileAsync(filePath);
                        if (backup != null && backup.Id == id)
                        {
                            return backup;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error reading backup file: {filePath}");
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting backup by id: {id}");
                throw;
            }
        }

        public async Task<bool> RestoreBackupAsync(Guid backupId)
        {
            try
            {
                var backup = await GetBackupByIdAsync(backupId);
                if (backup == null)
                {
                    throw new KeyNotFoundException($"Backup with id {backupId} not found");
                }

                if (backup.Status != "success")
                {
                    throw new InvalidOperationException($"Cannot restore backup with status: {backup.Status}");
                }

                if (!File.Exists(backup.FilePath))
                {
                    throw new FileNotFoundException($"Backup file not found: {backup.FilePath}");
                }

                // Đọc file backup
                var json = await File.ReadAllTextAsync(backup.FilePath);
                var backupData = JsonSerializer.Deserialize<JsonElement>(json);

                if (!backupData.TryGetProperty("Configurations", out var configsElement))
                {
                    throw new InvalidDataException("Invalid backup file format");
                }

                // Lấy tất cả config hiện tại để so sánh
                var existingConfigs = await _configRepo.GetAllAsync();
                var existingKeys = existingConfigs.Select(c => c.ConfigKey).ToHashSet();

                // Restore từng configuration
                foreach (var configElement in configsElement.EnumerateArray())
                {
                    var configKey = configElement.GetProperty("ConfigKey").GetString();
                    if (string.IsNullOrEmpty(configKey)) continue;

                    var config = new SystemConfiguration
                    {
                        ConfigKey = configKey,
                        ConfigValue = configElement.GetProperty("ConfigValue").GetString() ?? "",
                        DataType = configElement.GetProperty("DataType").GetString() ?? "string",
                        Category = configElement.GetProperty("Category").GetString() ?? "",
                        Description = configElement.TryGetProperty("Description", out var desc) ? desc.GetString() : null,
                        MinValue = configElement.TryGetProperty("MinValue", out var min) && min.ValueKind != JsonValueKind.Null 
                            ? min.GetDecimal() : null,
                        MaxValue = configElement.TryGetProperty("MaxValue", out var max) && max.ValueKind != JsonValueKind.Null 
                            ? max.GetDecimal() : null,
                        IsActive = configElement.TryGetProperty("IsActive", out var active) ? active.GetBoolean() : true,
                        UpdatedAt = configElement.TryGetProperty("UpdatedAt", out var updated) 
                            ? updated.GetDateTime() : DateTime.UtcNow,
                        UpdatedBy = configElement.TryGetProperty("UpdatedBy", out var updatedBy) 
                            ? updatedBy.GetString() : "system_restore"
                    };

                    if (existingKeys.Contains(configKey))
                    {
                        // Update existing
                        await _configRepo.UpdateAsync(config);
                    }
                    else
                    {
                        // Add new
                        await _configRepo.AddAsync(config);
                    }
                }

                _logger.LogInformation($"Backup restored successfully: {backupId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error restoring backup {backupId}");
                throw;
            }
        }

        public async Task<bool> DeleteBackupAsync(Guid id)
        {
            try
            {
                var backup = await GetBackupByIdAsync(id);
                if (backup == null)
                {
                    return false;
                }

                // Xóa file nếu tồn tại
                if (File.Exists(backup.FilePath))
                {
                    File.Delete(backup.FilePath);
                    _logger.LogInformation($"Backup file deleted: {backup.FilePath}");
                }

                _logger.LogInformation($"Backup deleted: {id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting backup {id}");
                throw;
            }
        }

        public async Task<int> CleanupOldBackupsAsync(int retentionDays)
        {
            try
            {
                if (!Directory.Exists(_backupDirectory))
                {
                    return 0;
                }

                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
                var backupFiles = Directory.GetFiles(_backupDirectory, "*.json");
                int deletedCount = 0;

                foreach (var filePath in backupFiles)
                {
                    try
                    {
                        var fileInfo = new FileInfo(filePath);
                        if (fileInfo.CreationTime < cutoffDate)
                        {
                            // Đọc backup để lấy ID
                            var backup = await GetBackupInfoFromFileAsync(filePath);
                            if (backup != null)
                            {
                                File.Delete(filePath);
                                deletedCount++;
                                _logger.LogInformation($"Deleted old backup: {backup.Id} - {filePath}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to delete backup file {filePath}");
                    }
                }

                _logger.LogInformation($"Cleaned up {deletedCount} old backups");
                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old backups");
                throw;
            }
        }

        public async Task<bool> CreateAutomaticBackupAsync()
        {
            try
            {
                // Kiểm tra xem auto backup có được bật không
                var autoBackupEnabled = await _configService.GetBoolValueAsync("AUTO_BACKUP_ENABLED");
                if (autoBackupEnabled != true)
                {
                    _logger.LogInformation("Automatic backup is disabled");
                    return false;
                }

                await CreateBackupAsync(createdBy: "system");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating automatic backup");
                return false;
            }
        }

        private async Task<BackupRecordResponse?> GetBackupInfoFromFileAsync(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    return null;
                }

                var json = await File.ReadAllTextAsync(filePath);
                var backupData = JsonSerializer.Deserialize<JsonElement>(json);

                var fileInfo = new FileInfo(filePath);

                var backupId = backupData.TryGetProperty("BackupId", out var idProp) 
                    ? idProp.GetGuid() 
                    : Guid.NewGuid();

                var createdAt = backupData.TryGetProperty("CreatedAt", out var dateProp)
                    ? dateProp.GetDateTime()
                    : fileInfo.CreationTime;

                var backupName = backupData.TryGetProperty("BackupName", out var nameProp)
                    ? nameProp.GetString() ?? Path.GetFileNameWithoutExtension(filePath)
                    : Path.GetFileNameWithoutExtension(filePath);

                var createdBy = backupData.TryGetProperty("CreatedBy", out var byProp)
                    ? byProp.GetString()
                    : null;

                var backupType = backupData.TryGetProperty("BackupType", out var typeProp)
                    ? typeProp.GetString() ?? "unknown"
                    : "unknown";

                var recordCount = backupData.TryGetProperty("RecordCount", out var countProp)
                    ? countProp.GetInt32()
                    : 0;

                return new BackupRecordResponse
                {
                    Id = backupId,
                    BackupName = backupName ?? Path.GetFileNameWithoutExtension(filePath),
                    FilePath = filePath,
                    BackupType = backupType,
                    FileSize = fileInfo.Length,
                    FileSizeFormatted = FormatFileSize(fileInfo.Length),
                    CreatedAt = createdAt,
                    CreatedBy = createdBy,
                    Status = "success",
                    RecordCount = recordCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error reading backup info from file: {filePath}");
                return null;
            }
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        private string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
