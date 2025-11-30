using System.Text.Json.Serialization;
using Medix.API.Business.Helper;
using Medix.API.Models.Enums;

namespace Medix.API.Models.DTOs.ApointmentDTO
{
    public class CreateAppointmentDto
    {
        public Guid? PatientId { get; set; }
        public Guid? DoctorId { get; set; }
        public string? DoctorName { get; set; }

        public Guid? AISymptomAnalysisId { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? AppointmentStartTime { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
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



