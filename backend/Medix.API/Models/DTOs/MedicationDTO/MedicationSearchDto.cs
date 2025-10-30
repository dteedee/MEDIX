namespace Medix.API.Models.DTOs.MedicationDTO
{
    public class MedicationSearchDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Dosage { get; set; } // Hàm lượng
        public string? Unit { get; set; } // Đơn vị tính
    }
}