using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class MedicalRecord
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }

    public string? ChiefComplaint { get; set; }

    public string? PhysicalExamination { get; set; }

    public string Diagnosis { get; set; } = null!;

    public string? AssessmentNotes { get; set; }

    public string? TreatmentPlan { get; set; }

    public string? FollowUpInstructions { get; set; }

    public string? DoctorNotes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;

    public virtual ICollection<MedicalRecordAttachment> MedicalRecordAttachments { get; set; } = new List<MedicalRecordAttachment>();

    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
