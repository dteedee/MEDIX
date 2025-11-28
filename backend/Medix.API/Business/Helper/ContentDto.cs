using Google.GenAI.Types;

namespace Medix.API.Business.Helper
{
    public class ContentDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public Blob? File { get; set; }
    }
}
