namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorServiceTierDetailDto
    {
        public Guid ServiceTierId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal ConsultationFeeMultiplier { get; set; }
        public int PriorityBoost { get; set; }
        public int MaxDailyAppointments { get; set; }
        public string? Features { get; set; }
        public decimal MonthlyPrice { get; set; }
        public bool IsActive { get; set; }
    }
}
