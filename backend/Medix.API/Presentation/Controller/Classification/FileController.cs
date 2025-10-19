using Medix.API.Business.Services.Community;
using Medix.API.Business.Validators;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    // Đổi tên route để tránh xung đột với controller khác
    [Route("api/classification/[controller]")]
    [ApiController]
    public class FileController : ControllerBase // Cân nhắc đổi tên class thành ClassificationFileController cho rõ ràng
    {
        private readonly CloudinaryService _cloudinaryService;

        public FileController(CloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

    
        [HttpPost("upload")] // Giữ tên action là "upload"
                             // Sử dụng ImageFileAttribute để xác thực tệp tải lên
        public async Task<IActionResult> UploadImage([ImageFile(maxFileSizeInMB: 10)] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn một tệp để tải lên." });
            }

            var uploadResult = await _cloudinaryService.UploadImageAsync(file);

            if (string.IsNullOrEmpty(uploadResult))
            {
                return StatusCode(500, new { message = "Lỗi khi tải ảnh lên Cloudinary." });
            }

            return Ok(new { url = uploadResult });
        }
    
    }
}