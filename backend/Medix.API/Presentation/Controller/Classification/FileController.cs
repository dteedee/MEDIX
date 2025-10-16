using Medix.API.Business.Services.Community;
using Medix.API.Business.Validators;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification

{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly CloudinaryService _cloudinaryService;

        public FileController(CloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        [HttpPost("Upload")]
        // Sử dụng ImageFileAttribute để xác thực tệp tải lên
        public async Task<IActionResult> UploadImage([FromForm, ImageFile(maxFileSizeInMB: 10)] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn một tệp để tải lên." });
            }

            var uploadResult = await _cloudinaryService.UploadImageAsync(file);

            if (uploadResult.Error != null)
            {
                return StatusCode(500, new { message = "Lỗi khi tải ảnh lên Cloudinary.", error = uploadResult.Error.Message });
            }

            return Ok(new { url = uploadResult.SecureUrl.ToString() });
        }
    }
}