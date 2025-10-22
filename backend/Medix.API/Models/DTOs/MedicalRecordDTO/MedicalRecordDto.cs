namespace Medix.API.Models.DTOs.MedicalRecordDTO
{
    public class MedicalRecordDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public string PatientName { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public DateTime AppointmentDate { get; set; }
        public string? ChiefComplaint { get; set; }
        public string? PhysicalExamination { get; set; }
        public string Diagnosis { get; set; } = null!;
        public string? AssessmentNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? FollowUpInstructions { get; set; }
        public string? DoctorNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<PrescriptionDto> Prescriptions { get; set; } = new();
    }

    public class CreateOrUpdateMedicalRecordDto
    {
        public Guid AppointmentId { get; set; }
        public string? ChiefComplaint { get; set; }
        public string? PhysicalExamination { get; set; }
        public string Diagnosis { get; set; } = null!;
        public string? AssessmentNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? FollowUpInstructions { get; set; }
        public string? DoctorNotes { get; set; }

        public List<CreatePrescriptionDto>? Prescriptions { get; set; }
    }
}
