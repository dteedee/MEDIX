using System;
using System.Collections.Generic;
using Medix.API.Models.Enums;

namespace Medix.API.Models.Entities;

public partial class UserRole
{
    public Guid UserId { get; set; }

    public string RoleCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual RefRole RoleCodeNavigation { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
