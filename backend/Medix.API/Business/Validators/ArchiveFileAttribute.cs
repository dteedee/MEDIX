using System.ComponentModel.DataAnnotations;

namespace Medix.API.Business.Validators
{
    public class ArchiveFileAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var file = value as IFormFile;

            if (file == null || file.Length == 0)
                return new ValidationResult("Vui lòng chọn một tệp ZIP hoặc RAR.", new[] { validationContext.MemberName });

            const long maxFileSize = 3 * 1024 * 1024; 
            Console.WriteLine(file.Length);
            if (file.Length > maxFileSize)
                return new ValidationResult("Kích thước tệp không được vượt quá 3MB.", new[] { validationContext.MemberName });

            var allowedMimeTypes = new[] { "application/zip", "application/x-rar-compressed", "application/octet-stream" };
            var allowedExtensions = new[] { ".zip", ".rar" };

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedMimeTypes.Contains(file.ContentType) && !allowedExtensions.Contains(fileExtension))
                return new ValidationResult("Tệp phải là định dạng ZIP hoặc RAR.", new[] { validationContext.MemberName });

            return ValidationResult.Success;
        }
    }

}
