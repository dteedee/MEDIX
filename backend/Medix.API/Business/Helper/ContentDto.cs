using Google.GenAI.Types;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Helper
{
    public class ContentDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;
        public ChatResponseDto? AIResponse { get; set; }
    }
}
