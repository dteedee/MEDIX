namespace Medix.API.Models.DTOs.AIChat
{
    public class ChatResponseDto
    {
        public string Text { get; set; } = string.Empty;
        public string? Type { get; set; }
        public object? Data { get; set; }
    }
}

