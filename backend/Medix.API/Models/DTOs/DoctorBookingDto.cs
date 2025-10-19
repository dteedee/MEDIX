namespace Medix.API.Models.DTOs
{
    public class DoctorBookingDto
    {
        public Guid userId { get; set; }
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; }
        public string specialization { get; set; }
        public string? Education { get; set; } // Ví dụ: "MD", "PhD", "BS", "MS"
        public string? Experience { get; set; } // Ví dụ: "MD", "PhD", "BS", "MS"
        public string ? price { get; set; }
        public decimal rating { get; set; }
    }
}
