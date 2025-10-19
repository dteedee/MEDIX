using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        [ProducesResponseType(typeof(Tuple<int, IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        // POST api/User - Tạo người dùng mới (dành cho admin)
        [HttpPost]
        [ProducesResponseType(typeof(UserDto), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userDto = await _userService.CreateUserAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = userDto.Id }, userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDTO updateUserDto)
        {
            var updatedUser = await _userService.UpdateAsync(id, updateUserDto);
            return Ok(updatedUser);
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _userService.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(Tuple<int, IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> SearchUsers([FromQuery] string keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Ok(await _userService.GetPagedAsync(page, pageSize));
            }
            var result = await _userService.SearchAsync(keyword, page, pageSize);
            return Ok(result);
        }
    }
}