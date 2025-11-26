namespace Medix.API.Models.DTOs.AIChat
{
    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatMessageDto>? ConversationHistory { get; set; }
    }

    public class ChatMessageDto
    {
        public string Text { get; set; } = string.Empty;
        public string Sender { get; set; } = string.Empty; // "user" or "ai"
        public string? Type { get; set; }
    }
}

