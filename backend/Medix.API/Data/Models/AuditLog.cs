using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class AuditLog
{
    public long Id { get; set; }

    public Guid? UserId { get; set; }

    public string ActionType { get; set; } = null!;

    public string? EntityType { get; set; }

    public string? EntityId { get; set; }

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }

    public DateTime Timestamp { get; set; }

    public virtual User? User { get; set; }
}
