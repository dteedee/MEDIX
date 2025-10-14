using System.ComponentModel.DataAnnotations;

namespace Medix.API.Application.ValidationAttributes
{
    public class ImageFileAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var file = value as IFormFile;

            if (file == null || file.Length == 0)
                return new ValidationResult("Vui lòng chọn một tệp hình ảnh.");

            if (!file.ContentType.StartsWith("image/"))
                return new ValidationResult("Tệp phải là hình ảnh (jpg, png, gif...).");

            return ValidationResult.Success;
        }
    }
}
