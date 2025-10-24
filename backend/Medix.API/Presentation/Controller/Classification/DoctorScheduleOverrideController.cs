using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/doctor-schedule-overrides")]
    public class DoctorScheduleOverrideController : ControllerBase
    {
        private readonly IDoctorScheduleOverrideService _service;

        public DoctorScheduleOverrideController(IDoctorScheduleOverrideService service)
        {
            _service = service;
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetByDoctor(Guid doctorId)
        {
            var result = await _service.GetByDoctorAsync(doctorId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDoctorScheduleOverrideDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorScheduleOverrideDto dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
        [HttpPut("doctor/{doctorId}")]
        public async Task<IActionResult> UpdateByDoctor(Guid doctorId, [FromBody] List<UpdateDoctorScheduleOverrideDto> dtos)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.UpdateByDoctorAsync(doctorId, dtos);
            return Ok(result);
        }
        [HttpPost("my")]
        //[Authorize(Roles = "Doctor")]
        public async Task<IActionResult> CreateForCurrentDoctor([FromBody] CreateDoctorScheduleOverrideDto dto)
        {
            try
            {
                // 1️⃣ Lấy userId từ token
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;

                if (userIdStr == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var userId = Guid.Parse(userIdStr);

                // 2️⃣ Gọi service
                var result = await _service.CreateByDoctorUserAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Có lỗi xảy ra khi tạo ghi đè lịch.", Details = ex.Message });
            }
        }
        [HttpPut("me")]

        public async Task<IActionResult> UpdateForCurrentDoctor([FromBody] List<UpdateDoctorScheduleOverrideDto> dtos)
        {
            try
            {
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;

                if (userIdStr == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var userId = Guid.Parse(userIdStr);

                var result = await _service.UpdateByDoctorUserAsync(dtos, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Có lỗi xảy ra khi cập nhật ghi đè lịch.", Details = ex.Message });
            }
        }


        // 🗑️ DELETE /api/doctor-schedule-overrides/my/{id}
        [HttpDelete("my/{id}")]
        //[Authorize(Roles = "Doctor")]
        public async Task<IActionResult> DeleteForCurrentDoctor(Guid id)
        {
            try
            {
                var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;

                if (userIdStr == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var userId = Guid.Parse(userIdStr);

                var success = await _service.DeleteByDoctorUserAsync(id, userId);
                if (!success)
                    return NotFound(new { Message = "Không tìm thấy ghi đè hoặc không có quyền xóa." });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Có lỗi xảy ra khi xóa ghi đè lịch.", Details = ex.Message });
            }
        }
    }
}
