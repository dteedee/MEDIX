using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Net;

namespace Medix.API.Business.Services.Community
{
    // Lớp mô phỏng cấu trúc kết quả trả về (nếu cần cho unit test hoặc môi trường dev)
    public class UploadError
    {
        public string? Message { get; set; }
    }

    public class UploadResult
    {
        public Uri? SecureUrl { get; set; }
        public UploadError? Error { get; set; }
    }

    public class CloudinaryService
    {
        private readonly Cloudinary? _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;
        private readonly IConfiguration _configuration;

        public CloudinaryService(ILogger<CloudinaryService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            var cloudName = _configuration["Cloudinary:CloudName"];
            var apiKey = _configuration["Cloudinary:ApiKey"];
            var apiSecret = _configuration["Cloudinary:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                _logger.LogWarning("Cloudinary credentials are missing. Running in simulation mode.");
                return; // Không throw để có thể test trong local mà không có credentials
            }

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        /// <summary>
        /// Upload image từ IFormFile (dùng trong Controller)
        /// </summary>
        public async Task<string> UploadImageAsync(IFormFile? file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    _logger.LogError("Invalid file provided for upload.");
                    return string.Empty;
                }

                var fileName = Path.GetFileNameWithoutExtension(file.FileName);
                await using var imageStream = file.OpenReadStream();

                // Nếu Cloudinary chưa được cấu hình (local dev mode)
                if (_cloudinary == null)
                {
                    _logger.LogWarning("Cloudinary chưa cấu hình. Sử dụng placeholder URL.");
                    return $"https://res.cloudinary.com/demo/image/upload/{Guid.NewGuid()}-{file.FileName}";
                }

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

        /// <summary>
        /// Upload image từ Stream — dùng cho service khác
        /// </summary>
        public async Task<string> UploadImageAsync(Stream imageStream, string fileName)
        {
            try
            {
                if (_cloudinary == null)
                {
                    _logger.LogWarning("Cloudinary chưa cấu hình. Sử dụng placeholder URL.");
                    await Task.Delay(100);
                    return $"https://res.cloudinary.com/demo/image/upload/{Guid.NewGuid()}-{fileName}";
                }

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

        /// <summary>
        /// Backwards-compatible wrapper used by controllers expecting UploadImageAsyncFile
        /// </summary>
        public async Task<string> UploadImageAsyncFile(Stream imageStream, string fileName)
        {
            return await UploadImageAsync(imageStream, fileName);
        }

        /// <summary>
        /// Xoá ảnh theo PublicId
        /// </summary>
        public async Task<bool> DeleteImageAsync(string publicId)
        {
            try
            {
                if (_cloudinary == null)
                {
                    _logger.LogWarning("Cloudinary chưa cấu hình. Giả lập xoá ảnh thành công.");
                    await Task.Delay(100);
                    return true;
                }

                var deletionParams = new DeletionParams(publicId)
                {
                    Invalidate = true
                };

                var result = await _cloudinary.DestroyAsync(deletionParams);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception when deleting image from Cloudinary");
                return false;
            }
        }

        /// <summary>
        /// Tạo URL hình ảnh tạm cho hiển thị (mock)
        /// </summary>
        public async Task<string> GenerateImageUrlAsync(string publicId, int width = 0, int height = 0)
        {
            await Task.Delay(50);
            return $"https://res.cloudinary.com/demo/image/upload/w_{width},h_{height}/{publicId}.jpg";
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
