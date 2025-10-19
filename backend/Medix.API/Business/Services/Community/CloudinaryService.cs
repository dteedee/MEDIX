using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Net;

namespace Medix.API.Business.Services.Community
{
    public class CloudinaryService
    {
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
            if (file?.Length > 0)
            {
                await using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Transformation = new Transformation().Crop("fill").Gravity("face")
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }
            return null;
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

        public async Task<string> UploadArchiveAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");

            using var stream = file.OpenReadStream();

            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = Path.GetFileNameWithoutExtension(file.FileName),
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.StatusCode != HttpStatusCode.OK)
                throw new Exception("Upload failed");

            return uploadResult.SecureUrl.ToString(); // or use .Url if you prefer http
        }

    }
}