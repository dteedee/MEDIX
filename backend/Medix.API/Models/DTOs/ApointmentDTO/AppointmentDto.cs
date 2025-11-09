﻿namespace Medix.API.Models.DTOs.ApointmentDTO
{
    public class AppointmentDto
    {
        public Guid Id { get; set; }
        public Guid PatientId { get; set; }

       public Guid? PatientID { get; set; }
        public Guid? DoctorID { get; set; }

        public string PatientName { get; set; } = null!;  
        public string DoctorName { get; set; } = null!;   

        public DateTime AppointmentStartTime { get; set; }
        public DateTime AppointmentEndTime { get; set; }
        public int DurationMinutes { get; set; }

        public string StatusCode { get; set; } = null!;
        public string StatusDisplayName { get; set; } = null!; 

        public decimal ConsultationFee { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public string PaymentStatusCode { get; set; } = null!;
        public string PaymentStatusName { get; set; } = null!; 
        public string? PaymentMethodCode { get; set; }
        public string? PaymentMethodName { get; set; }

        public string? TransactionId { get; set; }

        public decimal RefundAmount { get; set; }
        public string? RefundStatus { get; set; }
        public DateTime? RefundProcessedAt { get; set; }

        public string? MedicalInfo { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CancelAppointmentRequest
    {
        public Guid AppointmentId { get; set; }
        public string? CancellationReason { get; set; } // Optional
    }
}
