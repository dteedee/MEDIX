using Medix.API.Models.Entities;

using System;
using System.Collections.Generic;

namespace Medix.API.Models.Enums;

public partial class RefGender
{
    public string Code { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
