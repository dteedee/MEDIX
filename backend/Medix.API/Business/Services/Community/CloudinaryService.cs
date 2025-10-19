using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Medix.API.Business.Services.Community
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;
        private readonly IConfiguration _configuration;
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(ILogger<CloudinaryService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            var cloudName = _configuration["Cloudinary:CloudName"];
            var apiKey = _configuration["Cloudinary:ApiKey"];
            var apiSecret = _configuration["Cloudinary:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                throw new InvalidOperationException("Cloudinary environment variables are not set properly.");
            }

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
            _configuration = configuration;
        }

        public async Task<string?> UploadImageAsync(IFormFile? file)
        {
            try
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(fileName, imageStream),
                    PublicId = fileName,
                    Overwrite = true,
                    Folder = "user-avatars"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    return uploadResult.SecureUrl.ToString();
                }
                else
                {
                    _logger.LogError("Cloudinary upload failed: {0}", uploadResult.Error?.Message);
                    return string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception when uploading image to Cloudinary");
                return string.Empty;
            }
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