using System.ComponentModel.DataAnnotations;

namespace Medix.API.Business.Validators
{
    public class RequiredImageAttribute : ValidationAttribute
    {
        public int MaxSizeInMB { get; set; } = 2;

        public string[] AllowedContentTypes { get; set; } = [
            "image/jpeg", "image/png", "image/gif", "image/webp"
        ];

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var file = value as IFormFile;

            if (file == null || file.Length == 0)
            {
                return new ValidationResult("Vui lòng chọn một tệp ảnh.", new[] { validationContext.MemberName });
            }

            long maxSizeInBytes = MaxSizeInMB * 1024 * 1024;

            if (file.Length > maxSizeInBytes)
            {
                return new ValidationResult($"Kích thước ảnh không được vượt quá {MaxSizeInMB}MB.", new[] { validationContext.MemberName });
            }

            if (!AllowedContentTypes.Contains(file.ContentType.ToLower()))
            {
                return new ValidationResult("Tệp phải là ảnh hợp lệ (jpg, png, gif, webp).", new[] { validationContext.MemberName });
            }

            return ValidationResult.Success;
        }
    }
}
