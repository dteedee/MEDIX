namespace Medix.API.Models.Entities
{
    public class RefPromotionTarget
    {   public Guid Id { get; set; }     
        public string Name { get; set; } = null!;     
        public string Description { get; set; } = null!;

        public string Target { get; set; } = null!;
        public bool IsActive { get; set; } = true;

    }
}
