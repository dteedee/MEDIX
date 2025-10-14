using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs;

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

        [HttpGet]
        public async Task<ActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (total, data) = await _userService.GetPagedAsync(page, pageSize);
            var response = new PagedResponse<UserDto>
            {
                Total = total,
                Data = data
            };
            return Ok(response);
        }

        [HttpGet("search")]
        public async Task<ActionResult> SearchByName([FromQuery] string keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (total, data) = await _userService.SearchByNameAsync(keyword, page, pageSize);
            var response = new PagedResponse<UserDto>
            {
                Total = total,
                Data = data
            };
            return Ok(response);
        }

    }
}


