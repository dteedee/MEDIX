using Medix.API.Business.Services.Community;
using Medix.API.Business.Validators;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/classification/[controller]")]
    [ApiController]
    public class FileController : ControllerBase 
    {
        private readonly CloudinaryService _cloudinaryService;

        public FileController(CloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

    
        [HttpPost("upload")] 
        public async Task<IActionResult> UploadImage([ImageFile(maxFileSizeInMB: 10)] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn một tệp để tải lên." });
            }

            var imageUrl = await _cloudinaryService.UploadImageAsync(file);
            if (string.IsNullOrEmpty(imageUrl))
            {
                return StatusCode(500, new { message = "Lỗi khi tải ảnh lên Cloudinary." });
            }

            return Ok(new { url = imageUrl });
        }
    
    }
}