using System.IO;
using Medix.API.Models.DTOs.SystemConfiguration;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ISystemConfigurationService
    {
        Task<List<SystemConfigurationResponse>> GetAllAsync();
        Task<SystemConfigurationResponse?> GetByKeyAsync(string key);
        Task<T?> GetValueAsync<T>(string key);
        Task<int?> GetIntValueAsync(string key);
        Task<bool?> GetBoolValueAsync(string key);
        Task AddAsync(SystemConfigurationRequest request, string updatedBy);
        Task UpdateAsync(string key, object value, string updatedBy);
        Task DeleteAsync(string key);
        Task<PasswordPolicyDto> GetPasswordPolicyAsync();
        Task ValidatePasswordAsync(string password);
        Task<string> BackupDatabaseAsync(string? backupName = null);
        Task<List<DatabaseBackupInfo>> GetDatabaseBackupFilesAsync();
        Task<FileStream?> GetDatabaseBackupFileAsync(string fileName);
        Task RestoreDatabaseAsync(string backupFilePath);
        Task ExecuteSqlScriptAsync(string sqlScript);
        Task<EmailServerSettingsDto> GetEmailServerSettingsAsync();
        Task UpdateEmailServerSettingsAsync(UpdateEmailServerSettingsRequest request, string updatedBy);
        Task<List<EmailTemplateDto>> GetEmailTemplatesAsync();
        Task<EmailTemplateDto?> GetEmailTemplateAsync(string templateKey);
        Task UpdateEmailTemplateAsync(string templateKey, UpdateEmailTemplateRequest request, string updatedBy);
        string GetBackupFolderPath();
    }
}

