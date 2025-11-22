using Medix.API.Models.Enums;

namespace Medix.API.Models.DTOs.ApointmentDTO
{
    public class CreateAppointmentDto
    {
        public Guid? PatientId { get; set; }
        public Guid? DoctorId { get; set; }
        public string? DoctorName { get; set; }

        public Guid? AISymptomAnalysisId { get; set; }

        public DateTime? AppointmentStartTime { get; set; }
        public DateTime? AppointmentEndTime { get; set; }
        public int? DurationMinutes { get; set; }

        public decimal? ConsultationFee { get; set; }
        public decimal? PlatformFee { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal?  TotalAmount { get; set; }

        public Guid? TransactionID { get; set; }

        public string? StatusCode { get; set; } = null!;
        public string? PaymentStatusCode { get; set; } = null!;
        public string? PaymentMethodCode { get; set; }

        public string? MedicalInfo { get; set; }

        public string? chiefComplaint { get; set; }
        public string? historyOfPresentIllness { get; set; }

        public string? UserPromotionID { get; set; }
        public string? PromotionCode { get; set; }

    }
}



//using System;
//using System.Collections.Generic;
//using Medix.API.Models.Enums;

//namespace Medix.API.Models.Entities;

//public partial class Appointment
//{
//    public Guid Id { get; set; }

//    public Guid PatientId { get; set; }

//    public Guid DoctorId { get; set; }

//    public Guid? AISymptomAnalysisId { get; set; }

//    public DateTime AppointmentStartTime { get; set; }

//    public DateTime AppointmentEndTime { get; set; }

//    public int DurationMinutes { get; set; }

//    public string StatusCode { get; set; } = null!;

//    public decimal ConsultationFee { get; set; }

//    public decimal PlatformFee { get; set; }

//    public decimal DiscountAmount { get; set; }

//    public decimal TotalAmount { get; set; }

//    public string PaymentStatusCode { get; set; } = null!;

//    public string? PaymentMethodCode { get; set; }

//    public string? TransactionId { get; set; }

//    public decimal RefundAmount { get; set; }

//    public string? RefundStatus { get; set; }

//    public DateTime? RefundProcessedAt { get; set; }

//    public string? MedicalInfo { get; set; }

//    public DateTime CreatedAt { get; set; }

//    public DateTime UpdatedAt { get; set; }

//    public virtual AISymptomAnalysis? AISymptomAnalysis { get; set; }

//    public virtual ICollection<AppointmentStatusHistory> AppointmentStatusHistories { get; set; } = new List<AppointmentStatusHistory>();

//    public virtual Doctor Doctor { get; set; } = null!;

//    public virtual MedicalRecord? MedicalRecord { get; set; }

//    public virtual Patient Patient { get; set; } = null!;

//    public virtual ICollection<PatientHealthReminder> PatientHealthReminders { get; set; } = new List<PatientHealthReminder>();

//    public virtual RefPaymentMethod? PaymentMethodCodeNavigation { get; set; }

//    public virtual RefPaymentStatus PaymentStatusCodeNavigation { get; set; } = null!;

//    public virtual Review? Review { get; set; }

//    public virtual RefAppointmentStatus StatusCodeNavigation { get; set; } = null!;

//    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
//}
