namespace Medix.API.Models.DTOs.Manager
{
    public class SpecializationDistributionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public int DoctorCount { get; set; }

        public decimal Percentage { get; set; }
    }
}
