using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class MedicalRecordAttachment
{
    public Guid Id { get; set; }

    public Guid MedicalRecordId { get; set; }

    public string FileName { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public string FileTypeCode { get; set; } = null!;

    public long FileSize { get; set; }

    public Guid UploadedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual RefFileType FileTypeCodeNavigation { get; set; } = null!;

    public virtual MedicalRecord MedicalRecord { get; set; } = null!;

    public virtual User UploadedByNavigation { get; set; } = null!;
}
