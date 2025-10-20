using Medix.API.Models.Entities;

using System;
using System.Collections.Generic;

namespace Medix.API.Models.Enums;

public partial class RefFileType
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<MedicalRecordAttachment> MedicalRecordAttachments { get; set; } = new List<MedicalRecordAttachment>();
}
