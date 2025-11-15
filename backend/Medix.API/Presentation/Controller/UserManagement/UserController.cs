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
using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;
using Medix.API.Business.Interfaces.Community;
using Microsoft.Extensions.Logging;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Models.DTOs.Doctor;
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using Medix.API.Business.Interfaces.Classification;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly MedixContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<UserController> _logger;
        private readonly IPatientService _patientService;
        private readonly IMapper _mapper;
        private readonly ISystemConfigurationService _configService;

        public UserController(ILogger<UserController> logger, IUserService userService, MedixContext context, IEmailService emailService, IPatientService patientService
            ,IMapper mapper, ISystemConfigurationService configService)
        {
            _logger = logger;
            _userService = userService;
            _context = context;
            _emailService = emailService;
            _patientService = patientService;
            _mapper = mapper;
            _configService = configService;
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
            if (updateDto.EmergencyContactPhone != null || updateDto.EmergencyContactName != null || updateDto.Allergies != null || updateDto.MedicalHistory != null)
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

                var patientDTO = await _patientService.UpdateAsync(userId, patient);
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

        [HttpGet("roles")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.RefRoles
                .Where(r => r.IsActive)
                .Select(r => new { r.Code, r.DisplayName })
                .OrderBy(r => r.DisplayName)
                .ToListAsync();

            return Ok(roles);
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
                // 1. Generate a temporary password
                var temporaryPassword = GenerateRandomPassword();

                // 2. Create user with the temporary password
                var userDto = await _userService.CreateUserAsync(request, temporaryPassword);

                // 3. Send the temporary password to the user's email
                try
                {
                    await _emailService.SendNewUserPasswordAsync(userDto.Email, userDto.UserName, temporaryPassword);
                    _logger.LogInformation("Successfully sent temporary password to {Email}", userDto.Email);
                }
                catch (Exception emailEx)
                {
                    // Log the email sending failure but don't fail the whole request
                    // The user is created, they can use "Forgot Password" flow
                    _logger.LogWarning(emailEx, "Failed to send temporary password email to {Email} for new user {UserId}", userDto.Email, userDto.Id);
                }

                return CreatedAtAction(nameof(GetById), new { id = userDto.Id }, userDto);
            }
            catch (MedixException ex)
            {
                _logger.LogWarning(ex, "Failed to create user. Validation error.");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while creating the user.");
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }


        [HttpPut("{id}")]
        //[Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDTO updateUserDto)
        {
            // Lấy ID của người dùng đang thực hiện hành động từ token
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim.Value, out var currentUserId))
            {
                return Unauthorized(new { message = "Không thể xác thực người dùng hiện tại." });
            }

            try
            {
                var updatedUser = await _userService.UpdateAsync(id, updateUserDto, currentUserId);
                return Ok(updatedUser);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (MedixException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

        [HttpPost("{id}/admin-reset-password")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminResetPassword(Guid id)
        {
            try
            {
                // 1. Generate a new temporary password
                var temporaryPassword = GenerateRandomPassword();

                // 2. Update the user's password in the database
                // This requires a method in IUserService to update the password hash.
                var updatedUser = await _userService.AdminResetPasswordAsync(id, temporaryPassword);

                // 3. Send the new password via email using the existing service method
                await _emailService.SendNewUserPasswordAsync(updatedUser.Email, updatedUser.UserName, temporaryPassword);

                return Ok(new { message = "Mật khẩu đã được đặt lại và gửi đến email của người dùng." });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi quản trị viên đặt lại mật khẩu cho người dùng {UserId}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình đặt lại mật khẩu." });
            }
        }

        private string GenerateRandomPassword(int length = 12)
        {
            const string upper = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
            const string lower = "abcdefghijkmnopqrstuvwxyz";
            const string number = "0123456789";
            const string special = "!@#$%^&*_-";

            var random = new Random();
            var password = new char[length];
            password[0] = upper[random.Next(upper.Length)];
            password[1] = lower[random.Next(lower.Length)];
            password[2] = number[random.Next(number.Length)];
            password[3] = special[random.Next(special.Length)];

            var allChars = upper + lower + number + special;
            for (int i = 4; i < length; i++)
            {
                password[i] = allChars[random.Next(allChars.Length)];
            }

            // Xáo trộn mảng mật khẩu để tránh các ký tự đầu tiên luôn theo một thứ tự cố định
            // (ví dụ: luôn bắt đầu bằng chữ hoa, chữ thường, số, ký tự đặc biệt)
            // Đây là một dạng của thuật toán Fisher-Yates shuffle.
            for (int i = password.Length - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                // Hoán đổi vị trí
                (password[i], password[j]) = (password[j], password[i]);
            }

            return new string(password);
        }

        [HttpPut("update-password")]
        [Authorize]
        public async Task<IActionResult> UpdateDoctorPassword([FromBody] PasswordUpdatePresenter pre)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userId == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }
                var user = await _userService.GetUserAsync(Guid.Parse(userId.Value));
                if (user == null)
                {
                    return NotFound(new { Message = "Doctor not found" });
                }

                var req = _mapper.Map<PasswordUpdateRequest>(pre);
                var validationResults = new List<ValidationResult>();
                var context = new ValidationContext(req, null, null);

                Validator.TryValidateObject(req, context, validationResults, true);
                ValidateNewPassword(validationResults, req, user.PasswordHash);
                if (validationResults.Any())
                {
                    return BadRequest(validationResults);
                }

                // Validate new password against system configuration policy
                try
                {
                    await _configService.ValidatePasswordAsync(req.NewPassword);
                }
                catch (InvalidOperationException ex)
                {
                    validationResults.Add(new ValidationResult(ex.Message, new string[] { "NewPassword" }));
                    return BadRequest(validationResults);
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
                var updatedUser = await _userService.UpdateUserAsync(user);
                if (updatedUser == null)
                {
                    return StatusCode(500, new { Message = "An error occurred while updating the password" });
                }

                return Ok(new { Message = "Password updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating doctor password.");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        private List<ValidationResult> ValidateNewPassword(List<ValidationResult> prevResult, PasswordUpdateRequest req, string oldPassword)
        {
            if (req.NewPassword == oldPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu mới không được trùng với mật khẩu hiện tại", new string[] { "NewPassword" }));
            }

            if (req.NewPassword != req.ConfirmPassword)
            {
                prevResult.Add(new ValidationResult("Mật khẩu không khớp", new string[] { "ConfirmNewPassword" }));
            }

            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, oldPassword))
            {
                prevResult.Add(new ValidationResult("Mật khẩu cũ không đúng", new string[] { "CurrentPassword" }));
            }
            return prevResult;
        }
    }
}