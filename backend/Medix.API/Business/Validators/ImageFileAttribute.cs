using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace Medix.API.Business.Validators
{
    public class ImageFileAttribute : ValidationAttribute
    {
        private readonly int _maxFileSizeInBytes;

        // Mặc định giới hạn 5MB
        public ImageFileAttribute(int maxFileSizeInMB = 5)
        {
            _maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var file = value as IFormFile;

            if (file == null || file.Length == 0)
            {
                // Cho phép null nếu không phải là trường bắt buộc. RequiredAttribute nên được dùng riêng.
                return ValidationResult.Success;
            }

            if (file.Length > _maxFileSizeInBytes)
            {
                return new ValidationResult($"Kích thước tệp không được vượt quá {_maxFileSizeInBytes / 1024 / 1024}MB.");
            }

            // Kiểm tra ContentType trước để lọc nhanh
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedContentTypes.Contains(file.ContentType.ToLower()))
            {
                return new ValidationResult("Loại tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.");
            }

            // Kiểm tra Magic Bytes để xác thực nội dung tệp
            using (var reader = new BinaryReader(file.OpenReadStream()))
            {
                var signatures = _fileSignatures.Values.SelectMany(x => x).ToList();
                var headerBytes = reader.ReadBytes(signatures.Max(m => m.Length));
                
                if (!_fileSignatures.Any(s => s.Value.Any(sig => headerBytes.Take(sig.Length).SequenceEqual(sig))))
                {
                    return new ValidationResult("Nội dung tệp không phải là hình ảnh hợp lệ.");
                }
            }

            return ValidationResult.Success;
        }

        // Danh sách các "magic bytes" cho các định dạng ảnh phổ biến
        private static readonly Dictionary<string, List<byte[]>> _fileSignatures = new Dictionary<string, List<byte[]>>
        {
            { ".jpeg", new List<byte[]>
                {
                    new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 },
                    new byte[] { 0xFF, 0xD8, 0xFF, 0xE1 },
                    new byte[] { 0xFF, 0xD8, 0xFF, 0xE8 }
                }
            },
            { ".png", new List<byte[]> { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
            { ".gif", new List<byte[]> { new byte[] { 0x47, 0x49, 0x46, 0x38 } } },
            { ".webp", new List<byte[]>
                {
                    // RIFF **** WEBP
                    new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50 }
                }
            }
        };
    }
}
