using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.Models.DTOs.Patient
{
    public class AppointmentBookingDto
    {
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }
        public Guid? AISymptomAnalysisId { get; set; }
        public DateTime AppointmentStartTime { get; set; }
        public DateTime AppointmentEndTime { get; set; }
        public string StatusCode { get; set; } = null!;
        public decimal? ConsultationFee { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string PaymentStatusCode { get; set; } = null!;
        public string? PaymentMethodCode { get; set; }

    }

     
    }
