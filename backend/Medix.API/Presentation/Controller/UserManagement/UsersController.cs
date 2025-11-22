using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.UserManagement;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }
   
        // View all users (basic info) including seeded/temp users in DB
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var users = await _userService.GetAllAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users list");
                return StatusCode(500, new { message = "An error occurred while fetching users" });
            }
        }
    }
}





