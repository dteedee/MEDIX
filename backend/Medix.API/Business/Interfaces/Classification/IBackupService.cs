using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IBackupService
    {
        Task<BackupRecordResponse> CreateBackupAsync(string? backupName = null, string? createdBy = null);
        Task<List<BackupRecordResponse>> GetAllBackupsAsync();
        Task<BackupRecordResponse?> GetBackupByIdAsync(Guid id);
        Task<bool> RestoreBackupAsync(Guid backupId);
        Task<bool> DeleteBackupAsync(Guid id);
        Task<int> CleanupOldBackupsAsync(int retentionDays);
        Task<bool> CreateAutomaticBackupAsync();
    }
}

