using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class Appointment
{
    public Guid Id { get; set; }

    public Guid PatientId { get; set; }

    public Guid DoctorId { get; set; }

    public Guid? AISymptomAnalysisId { get; set; }

    public DateTime AppointmentStartTime { get; set; }

    public DateTime AppointmentEndTime { get; set; }

    public int DurationMinutes { get; set; }

    public string Status { get; set; } = null!;

    public decimal ConsultationFee { get; set; }

    public decimal PlatformFee { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string PaymentStatus { get; set; } = null!;

    public string? PaymentMethod { get; set; }

    public string? TransactionId { get; set; }

    public decimal RefundAmount { get; set; }

    public string? RefundStatus { get; set; }

    public DateTime? RefundProcessedAt { get; set; }

    public string? MedicalInfo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual AISymptomAnalysis? AISymptomAnalysis { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;

    public virtual MedicalRecord? MedicalRecord { get; set; }

    public virtual Patient Patient { get; set; } = null!;

    public virtual ICollection<PatientHealthReminder> PatientHealthReminders { get; set; } = new List<PatientHealthReminder>();

    public virtual Review? Review { get; set; }

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
