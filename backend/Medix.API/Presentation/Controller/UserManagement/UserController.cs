using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;
        private readonly IPatientService _patientService;
        public UserController(ILogger<UserController> logger, IUserService userService, IPatientService patientService)
        {
            _logger = logger;
            _userService = userService;
            _patientService = patientService;
        }

        // ========================= USER SELF MANAGEMENT =========================

        [HttpGet("getUserInfor")]
        [Authorize]
        public async Task<IActionResult> GetUserInfor()
        {
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            updateDto.Id = userId;

            var updatedUser = await _userService.UpdateUserBasicInfo(updateDto);
            if (updateDto.EmergencyContactPhone != null || updateDto.EmergencyContactName != null || updateDto.Allergies != null || updateDto.MedicalHistory!=null)
            {
               
                var patient = await _patientService.GetByUserIdAsync(userId);

               
                if (patient == null)
                {
                 
                    return NotFound(new { message = $"Không tìm thấy hồ sơ bệnh nhân (Patient) cho user ID: {userId}" });
                }

                patient.EmergencyContactName = updateDto.EmergencyContactName;
                patient.EmergencyContactPhone = updateDto.EmergencyContactPhone;
                patient.Allergies = updateDto.Allergies;
                patient.MedicalHistory = updateDto.MedicalHistory;

                var patientDTO =   await _patientService.UpdateAsync(userId, patient);
                if (patientDTO == null)
                {
                    return StatusCode(500, new { message = "Cập nhật thông tin liên hệ khẩn cấp thất bại." });
                } 
               
            }
            return Ok(updatedUser);
        }




        [HttpPost("uploadAvatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, [FromServices] CloudinaryService cloudinaryService)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            const long maxFileSize = 5 * 1024 * 1024;
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "File quá lớn (tối đa 5 MB)" });

            if (string.IsNullOrWhiteSpace(file.ContentType) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "File must be an image." });

            var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || !allowedExt.Contains(ext))
                return BadRequest(new { message = "Định dạng file không được hỗ trợ." });

            try
            {
                using var stream = file.OpenReadStream();
                var fileName = $"{userId}_{Guid.NewGuid()}{ext}";
                var imageUrl = await cloudinaryService.UploadImageAsync(stream, fileName);

                if (string.IsNullOrEmpty(imageUrl))
                    return StatusCode(500, new { message = "Image upload failed" });

                var user = await _userService.GetByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                await _userService.UpdateAvatarURL(imageUrl, user.Id);

                return Ok(new { imageUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for user {UserId}", userIdClaim.Value);
                return StatusCode(500, new { message = "Cloud upload error", detail = ex.Message });
            }
        }

        // ========================= ADMIN MANAGEMENT =========================

        [HttpGet]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(Tuple<int, IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost]
        [ProducesResponseType(typeof(UserDto), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userDto = await _userService.CreateUserAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = userDto.Id }, userDto);
            }
            catch (MedixException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }


        [HttpPut("{id}")]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDTO updateUserDto)
        {
            var updatedUser = await _userService.UpdateAsync(id, updateUserDto);
            return Ok(updatedUser);
        }

        [HttpDelete("{id}")]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _userService.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("search")]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(Tuple<int, IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> SearchUsers([FromQuery] string keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return Ok(await _userService.GetPagedAsync(page, pageSize));

            var result = await _userService.SearchAsync(keyword, page, pageSize);
            return Ok(result);
        }
    }
}