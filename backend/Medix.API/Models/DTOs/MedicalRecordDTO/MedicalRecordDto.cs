namespace Medix.API.Models.DTOs.MedicalRecordDTO
{
    public class MedicalRecordDto
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid PatientId { get; set; }
        public int VisitNumber { get; set; }

        // --- Thông tin bệnh nhân ---
        public string PatientName { get; set; } = null!;
        public string MedicalRecordNumber { get; set; } = null!;
        public string? BloodTypeCode { get; set; }
        public decimal? Height { get; set; }
        public decimal? Weight { get; set; }
        public string? MedicalHistory { get; set; }
        public string? Allergies { get; set; }

        // ✅ Các trường mới
        public string? GenderCode { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? PhoneNumber { get; set; }

        // --- Thông tin bác sĩ & cuộc hẹn ---
        public string DoctorName { get; set; } = null!;
        public DateTime AppointmentDate { get; set; }

        public DateTime AppointmentStartDate { get; set; }
        public DateTime AppointmentEndDate { get; set; }

        public string StatusAppointment { get; set; }


        // --- Thông tin hồ sơ ---
        public string? ChiefComplaint { get; set; }
        public string? PhysicalExamination { get; set; }
        public string Diagnosis { get; set; } = null!;
        public string? AssessmentNotes { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? FollowUpInstructions { get; set; }
        public string? DoctorNotes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // --- Đơn thuốc ---
        public List<PrescriptionDto> Prescriptions { get; set; } = new();
    }
    

    public class PrescriptionDetailDto
    {
        public Guid Id { get; set; }

        // Kê đơn
        public string MedicationName { get; set; } = null!;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Instructions { get; set; }

        // Thông tin thuốc (MedicationDatabase)
        public string? GenericName { get; set; }
        public string? DosageForms { get; set; }
        public string? CommonUses { get; set; }
        public string? SideEffects { get; set; }
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
        public bool UpdatePatientMedicalHistory { get; set; } = false;
        public string? NewAllergy { get; set; }
        public bool UpdatePatientAllergies { get; set; } = false;

    }
}
