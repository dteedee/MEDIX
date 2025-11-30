namespace Medix.API.Models.DTOs.Doctor
{
    public class UpdateServiceTierRequest
    {
        public Guid ServiceTierId { get; set; }
        public string? Description { get; set; }
        public decimal MonthlyPrice { get; set; }
    }
}
