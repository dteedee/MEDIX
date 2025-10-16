using System.Security.Claims;
using Medix.API.Business.Interfaces.UserManagement;
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

    }
}
