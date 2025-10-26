﻿﻿﻿using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/doctor-schedules")]
    public class DoctorScheduleController : ControllerBase
    {
        private readonly IDoctorScheduleService _scheduleService;
        private readonly IDoctorService _doctorService;

        public DoctorScheduleController(
            IDoctorScheduleService scheduleService,
            IDoctorService doctorService)
        {
            _scheduleService = scheduleService;
            _doctorService = doctorService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMySchedules()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { Message = "User ID not found in token" });

            var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userIdClaim.Value));
            if (doctor == null)
                return NotFound(new { Message = "Doctor not found for this user" });

            var result = await _scheduleService.GetByDoctorIdAsync(doctor.Id);
            return Ok(result);
        }

        // ✅ Cập nhật toàn bộ lịch cho chính bác sĩ đang đăng nhập
        //[HttpPut("me")]
        //public async Task<IActionResult> UpdateMySchedules([FromBody] IEnumerable<UpdateDoctorScheduleDto> schedules)
        //{
        //    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        //    if (userIdClaim == null)
        //        return Unauthorized(new { Message = "User ID not found in token" });

        //    var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userIdClaim.Value));
        //    if (doctor == null)
        //        return NotFound(new { Message = "Doctor not found for this user" });

        //    var updated = await _scheduleService.UpdateByDoctorIdAsync(doctor.Id, schedules);
        //    return Ok(updated);
        //}

        // ✅ Cập nhật một lịch cụ thể cho bác sĩ đang đăng nhập
        [HttpPut("me/{scheduleId}")]
        public async Task<IActionResult> UpdateMySchedule(Guid scheduleId, [FromBody] UpdateDoctorScheduleDto schedule)
        {
            if (scheduleId != schedule.Id)
            {
                return BadRequest(new { Message = "Schedule ID in URL does not match ID in body." });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { Message = "User ID not found in token" });

            var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userIdClaim.Value));
            if (doctor == null)
                return NotFound(new { Message = "Doctor not found for this user" });

            var updated = await _scheduleService.UpdateSingleByDoctorIdAsync(doctor.Id, schedule);
            if (updated == null)
                return NotFound(new { Message = "Schedule not found." });

            return Ok(updated);
        }

        [HttpPost("me")]
        public async Task<IActionResult> CreateMySchedules([FromBody] IEnumerable<CreateDoctorScheduleDto> schedules)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { Message = "User ID not found in token" });

            var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userIdClaim.Value));
            if (doctor == null)
                return NotFound(new { Message = "Doctor not found for this user" });

            var updated = await _scheduleService.CreateByDoctorIdAsync(doctor.Id, schedules);
            return Ok(updated);


        }
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMySchedules([FromBody] IEnumerable<Guid> scheduleIds)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { Message = "User ID not found in token" });

            var doctor = await _doctorService.GetDoctorByUserIdAsync(Guid.Parse(userIdClaim.Value));
            if (doctor == null)
                return NotFound(new { Message = "Doctor not found for this user" });

            var deleted = await _scheduleService.DeleteByDoctorIdAsync(doctor.Id, scheduleIds);
            return Ok(new { Message = $"{deleted} schedule(s) deleted successfully" });
        }
    }
}