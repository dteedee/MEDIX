using System.Security.Claims;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(ILogger<UserController> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

    [HttpGet("getUserInfor")]
    [Authorize]
    public async Task<IActionResult> GetUserInfor()
    {
        // Lấy userId từ JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null)
            return Unauthorized(new { message = "User ID not found in token" });

        if (!Guid.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { message = "Invalid user ID in token" });

        var userInfo = await _userService.GetUserBasicInfo(userId);
        if (userInfo == null)
            return NotFound(new { message = "User not found" });

        return Ok(userInfo);
    }
        [HttpPut("updateUserInfor")]
        [Authorize]
        public async Task<IActionResult> UpdateUserInfor([FromBody] UpdateUserDto updateDto)
        {
            // Lấy userId từ JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            updateDto.Id = userId; // Sửa ở đây

            var updatedUser = await _userService.UpdateUserBasicInfo(updateDto);
            return Ok(updatedUser);
        }
        [HttpPost("uploadAvatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, [FromServices] CloudinaryService cloudinaryService)
        {
            // Lấy userId từ JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Giới hạn kích thước (ví dụ 5 MB)
            const long maxFileSize = 5 * 1024 * 1024;
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "File quá lớn (tối đa 5 MB)" });

            // Kiểm tra loại file (chỉ nhận ảnh)
            if (string.IsNullOrWhiteSpace(file.ContentType) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "File must be an image." });

            // Kiểm tra phần mở rộng an toàn (tuỳ chọn nhưng nên có)
            var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || !allowedExt.Contains(ext))
                return BadRequest(new { message = "Định dạng file không được hỗ trợ." });

            try
            {
                using var stream = file.OpenReadStream();
                var fileName = $"{userId}_{Guid.NewGuid()}{ext}"; // loại bỏ tên gốc (tránh ký tự lạ)
                var imageUrl = await cloudinaryService.UploadImageAsyncFile(stream, fileName);

                if (string.IsNullOrEmpty(imageUrl))
                    return StatusCode(500, new { message = "Image upload failed" });

                // Lấy user và cập nhật AvatarUrl bằng service async
                var user = await _userService.GetByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                await _userService.UpdateAvatarURL(imageUrl, user.Id); // dùng phương thức async

                return Ok(new { imageUrl });
            }
            catch (Exception cex)
            {
                // nếu Cloudinary ném lỗi (tùy lib)
                return StatusCode(500, new { message = "Cloud upload error", detail = cex.Message });
            }

        }


    }
}