using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class MedicationDatabase
{
    public Guid Id { get; set; }

    public string MedicationName { get; set; } = null!;

    public string? GenericName { get; set; }

    public string? DosageForms { get; set; }

    public string? CommonUses { get; set; }

    public string? SideEffects { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
