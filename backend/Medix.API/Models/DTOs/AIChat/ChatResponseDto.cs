namespace Medix.API.Models.DTOs.AIChat
{
    public class ChatResponseDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Text { get; set; } = string.Empty;
        public string Sender { get; set; } = "ai";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Type { get; set; }
        public object? Data { get; set; }
    }
}

