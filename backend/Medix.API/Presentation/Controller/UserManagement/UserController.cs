using Medix.API.Business.Interfaces.UserManagement;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        public async Task<IActionResult> GetUserInfoFromToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return null;
            }
            var userId = Guid.Parse(userIdClaim.Value);
            var userInfo = await _userService.GetByIdAsync(userId);

            return Ok(new
            {
                userInfo.FullName,
                userInfo.Role,
            });
        }
    }
}
