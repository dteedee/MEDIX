using System;

namespace Medix.API.Models.DTOs
{
    public class BackupRecordResponse
    {
        public Guid Id { get; set; }
        public string BackupName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public string BackupType { get; set; } = null!;
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string Status { get; set; } = null!;
        public string? ErrorMessage { get; set; }
        public int RecordCount { get; set; }
    }

    public class CreateBackupRequest
    {
        public string? BackupName { get; set; }
    }

    public class RestoreBackupRequest
    {
        public Guid BackupId { get; set; }
    }

    public class DatabaseBackupInfo
    {
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public long FileSize { get; set; }
        public string FileSizeFormatted { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}

