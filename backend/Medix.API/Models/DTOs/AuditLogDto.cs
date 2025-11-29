namespace Medix.API.Models.DTOs
{
    public class AuditLogDto
    {
        public long Id { get; set; }
        public string? UserName { get; set; }
        public string ActionType { get; set; } = null!;
        public string EntityType { get; set; } = null!;
        public string EntityId { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }

        public object? OldValues { get; set; }
        public object? NewValues { get; set; }
    }
}
