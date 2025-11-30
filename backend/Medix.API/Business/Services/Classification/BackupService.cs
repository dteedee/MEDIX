using System.Security.Cryptography;
using System.Text;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.SystemConfiguration;

namespace Medix.API.Business.Services.Classification
{
    public class BackupService : IBackupService
    {
        private readonly ISystemConfigurationService _configService;
        private readonly ILogger<BackupService> _logger;

        public BackupService(
            ISystemConfigurationService configService,
            ILogger<BackupService> logger)
        {
            _configService = configService;
            _logger = logger;
        }

        public async Task<BackupRecordResponse> CreateBackupAsync(string? backupName = null, string? createdBy = null)
        {
            try
            {
                var backupPath = await _configService.BackupDatabaseAsync(backupName);
                var fileInfo = new FileInfo(backupPath);
                var createdAt = fileInfo.CreationTimeUtc;

                var response = new BackupRecordResponse
                {
                    Id = GenerateDeterministicId(fileInfo.FullName),
                    BackupName = backupName ?? Path.GetFileNameWithoutExtension(fileInfo.Name),
                    FilePath = fileInfo.FullName,
                    BackupType = createdBy != null ? "manual" : "automatic",
                    FileSize = fileInfo.Length,
                    FileSizeFormatted = FormatFileSize(fileInfo.Length),
                    CreatedAt = createdAt,
                    CreatedBy = createdBy,
                    Status = "success",
                    RecordCount = 0
                };

                _logger.LogInformation("Database backup created successfully at {FilePath}", fileInfo.FullName);
                return response;
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
                var backupFiles = await _configService.GetDatabaseBackupFilesAsync();
                return backupFiles
                    .Select(MapToBackupRecord)
                    .ToList();
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
                var backups = await GetAllBackupsAsync();
                return backups.FirstOrDefault(b => b.Id == id);
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

                await _configService.RestoreDatabaseAsync(backup.FilePath);
                _logger.LogInformation("Database restored successfully from backup {BackupId}", backupId);
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
                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
                var backupFiles = await _configService.GetDatabaseBackupFilesAsync();
                int deletedCount = 0;

                foreach (var backup in backupFiles.Where(b => b.CreatedAt < cutoffDate))
                {
                    try
                    {
                        if (File.Exists(backup.FilePath))
                        {
                            File.Delete(backup.FilePath);
                            deletedCount++;
                            _logger.LogInformation("Deleted old database backup: {FilePath}", backup.FilePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete backup file {FilePath}", backup.FilePath);
                    }
                }

                _logger.LogInformation("Cleaned up {DeletedCount} old database backups", deletedCount);
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

        private BackupRecordResponse MapToBackupRecord(DatabaseBackupInfo info)
        {
            return new BackupRecordResponse
            {
                Id = GenerateDeterministicId(info.FilePath),
                BackupName = Path.GetFileNameWithoutExtension(info.FileName),
                FilePath = info.FilePath,
                BackupType = "database",
                FileSize = info.FileSize,
                FileSizeFormatted = info.FileSizeFormatted,
                CreatedAt = info.CreatedAt,
                CreatedBy = null,
                Status = "success",
                RecordCount = 0
            };
        }

        private Guid GenerateDeterministicId(string input)
        {
            using var md5 = MD5.Create();
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = md5.ComputeHash(bytes);
            return new Guid(hash);
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }
    }
}
