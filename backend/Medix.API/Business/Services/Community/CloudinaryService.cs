using Microsoft.Extensions.Logging;

namespace Medix.API.Business.Services.Community
{
    public class CloudinaryService
    {
        private readonly ILogger<CloudinaryService> _logger;

        public CloudinaryService(ILogger<CloudinaryService> logger)
        {
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(Stream imageStream, string fileName)
        {
            await Task.Delay(100);
            _logger.LogWarning("CloudinaryService chưa được triển khai. Cần package CloudinaryDotNet.");
            return $"https://placeholder.com/{fileName}";
        }

        public async Task<bool> DeleteImageAsync(string publicId)
        {
            await Task.Delay(100);
            _logger.LogWarning("CloudinaryService delete chưa được triển khai.");
            return true;
        }

        public async Task<string> GenerateImageUrlAsync(string publicId, int width = 0, int height = 0)
        {
            await Task.Delay(50);
            return $"https://placeholder.com/{width}x{height}/{publicId}";
        }
    }
}