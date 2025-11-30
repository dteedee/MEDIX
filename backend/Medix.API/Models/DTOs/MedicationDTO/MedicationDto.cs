namespace Medix.API.Models.DTOs.MedicationDTO
{
    public class MedicationDto
    {
        public Guid Id { get; set; }
        public string MedicationName { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? DosageForms { get; set; }
        public string? CommonUses { get; set; }
        public string? SideEffects { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MedicationCreateDto
    {
        public string MedicationName { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? DosageForms { get; set; }
        public string? CommonUses { get; set; }
        public string? SideEffects { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class MedicationUpdateDto
    {
        public string MedicationName { get; set; } = null!;
        public string? GenericName { get; set; }
        public string? DosageForms { get; set; }
        public string? CommonUses { get; set; }
        public string? SideEffects { get; set; }
        public bool IsActive { get; set; }
    }
}
