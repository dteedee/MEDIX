using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class Prescription
{
    public Guid Id { get; set; }

    public Guid MedicalRecordId { get; set; }

    public Guid? MedicationId { get; set; }

    public string MedicationName { get; set; } = null!;

    public string? Dosage { get; set; }

    public string? Frequency { get; set; }

    public string? Duration { get; set; }

    public string? Instructions { get; set; }

    public virtual MedicalRecord MedicalRecord { get; set; } = null!;

    public virtual MedicationDatabase? Medication { get; set; }
}
