using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class UserRole
{
    public Guid UserId { get; set; }

    public string RoleCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual RefRole RoleCodeNavigation { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
