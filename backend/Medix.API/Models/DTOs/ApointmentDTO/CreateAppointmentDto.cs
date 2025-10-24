namespace Medix.API.Models.DTOs.ApointmentDTO
{
    public class CreateAppointmentDto
    {
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }

        public DateTime AppointmentStartTime { get; set; }
        public DateTime AppointmentEndTime { get; set; }
        public int DurationMinutes { get; set; }

        public decimal ConsultationFee { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public string StatusCode { get; set; } = null!;
        public string PaymentStatusCode { get; set; } = null!;
        public string? PaymentMethodCode { get; set; }

        public string? MedicalInfo { get; set; }
    }
}
