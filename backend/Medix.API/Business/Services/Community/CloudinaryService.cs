using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System.Net;
using System.IO.Compression;

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

        public async Task<string> UploadImageAsync(IFormFile? file)
        {
            return await UploadImageAsync(file, null);
        }

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

                if (uploadResult.StatusCode == HttpStatusCode.OK)
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

        public async Task<string> UploadArchiveAsync(IFormFile? file, string? fileName = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("File is required");

                if (_cloudinary == null)
                {
                    _logger.LogWarning("Cloudinary chưa cấu hình. Sử dụng placeholder URL.");
                    return string.Empty;
                }

                using var stream = file.OpenReadStream();
                string publicId;
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    publicId = Guid.NewGuid().ToString();
                }
                else
                {
                    publicId = $"{fileName}_{Guid.NewGuid()}";
                }

                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    PublicId = publicId,
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode != HttpStatusCode.OK)
                    throw new Exception(uploadResult.Error.Message);

                return uploadResult.SecureUrl.ToString(); // or use .Url if you prefer http
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception when uploading archive to Cloudinary");
                return string.Empty;
            }
        }

        public async Task<string> UploadImageAsync(IFormFile? file, string? fileName = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return string.Empty;

                // Nếu Cloudinary chưa được cấu hình (local dev mode)
                if (_cloudinary == null)
                {
                    _logger.LogWarning("Cloudinary chưa cấu hình. Sử dụng placeholder URL.");
                    return $"https://res.cloudinary.com/demo/image/upload/{Guid.NewGuid()}-{file.FileName}";
                }

                using var stream = file.OpenReadStream();
                string publicId;
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    publicId = Guid.NewGuid().ToString();
                }
                else
                {
                    publicId = $"{fileName}_{Guid.NewGuid()}";
                }

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    PublicId = publicId,
                    Overwrite = true
                };

                var result = await _cloudinary.UploadAsync(uploadParams);

                if (result.StatusCode == HttpStatusCode.OK)
                {
                    return result.SecureUrl.ToString();
                }
                else
                {
                    throw new Exception($"Upload failed: {result.Error?.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception when uploading image to Cloudinary");
                return string.Empty;
            }
        }

        public async Task<string> UploadArchiveAsync(IFormFile? file)
        {
            return await UploadArchiveAsync(file, null);
        }

        public async Task<string> UploadMultipleFilesAsync(List<IFormFile?>? files, string? fileName = null)
        {
            if (files == null || files.Count == 0)
                throw new ArgumentException("No files provided");

            var validFiles = files.Where(f => f != null).ToList();
            if (validFiles.Count == 0)
                throw new ArgumentException("All files were null");

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var file in validFiles)
                {
                    var entry = archive.CreateEntry(file!.FileName, CompressionLevel.Fastest);
                    using var entryStream = entry.Open();
                    using var fileStream = file.OpenReadStream();
                    await fileStream.CopyToAsync(entryStream);
                }
            }

            memoryStream.Position = 0;

            // Wrap into IFormFile-like object
            var zipFile = new FormFile(memoryStream, 0, memoryStream.Length, "archive", fileName ?? "archive.zip");

            return await UploadArchiveAsync(zipFile, "IdentityCardImages");
        }

        public async Task<string> UploadMultipleFilesAsync(List<IFormFile?>? files)
            => await UploadMultipleFilesAsync(files, null);
    }
}
