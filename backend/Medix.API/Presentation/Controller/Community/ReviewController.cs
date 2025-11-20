﻿using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.ReviewDTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controllers.Community
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _service;

        public ReviewController(IReviewService service)
        {
            _service = service;
        }

        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointment(Guid appointmentId)
        {
            var result = await _service.GetByAppointmentIdAsync(appointmentId);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy đánh giá cho cuộc hẹn này." });

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.UpdateAsync(dto);
            return Ok(result);
        }

        [HttpDelete("{appointmentId:guid}")]
        public async Task<IActionResult> Delete(Guid appointmentId)
        {
            await _service.DeleteAsync(appointmentId);
            return Ok(new { message = "Đã xóa đánh giá thành công." });
        }
        [HttpGet("by-doctor/{doctorId:guid}")]
        public async Task<IActionResult> GetByDoctor(Guid doctorId)
        {
            var result = await _service.GetByDoctorIdAsync(doctorId);
            if (result == null || !result.Any())
                return NotFound(new { message = "Không tìm thấy đánh giá cho bác sĩ này." });

            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetMyReviews()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            var result = await _service.GetByDoctorUserIdAsync(userId);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllReview()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpPatch("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateReviewStatusDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _service.UpdateStatusAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

    }
}
