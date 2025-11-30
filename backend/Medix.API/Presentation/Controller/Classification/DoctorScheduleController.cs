﻿using Medix.API.Business.Interfaces.Classification;
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
        private readonly INotificationService _notificationService;

        public DoctorScheduleController(
            IDoctorScheduleService scheduleService,
            IDoctorService doctorService,
            INotificationService notificationService)
        {
            _scheduleService = scheduleService;
            _doctorService = doctorService;
            _notificationService = notificationService;
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

            try
            {
                var updated = await _scheduleService.UpdateSingleByDoctorIdAsync(doctor.Id, schedule);
                if (updated == null)
                {
                    try
                    {
                        await _notificationService.CreateNotificationAsync(
                            doctor.UserId,
                            "Cập nhật lịch cố định thất bại",
                            $"Không tìm thấy lịch cố định để cập nhật vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                            "ScheduleUpdateFailed",
                            null
                        );
                    }
                    catch
                    {
                    }
                    
                    return NotFound(new { Message = "Schedule not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Cập nhật lịch cố định thất bại",
                        $"Cập nhật lịch cố định thất bại: {ex.Message} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleUpdateFailed",
                        null
                    );
                }
                catch
                {
                }
                
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Cập nhật lịch cố định thất bại",
                        $"Cập nhật lịch cố định thất bại: {ex.Message} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleUpdateFailed",
                        null
                    );
                }
                catch
                {
                }
                
                return StatusCode(500, new { Message = "Có lỗi xảy ra khi cập nhật lịch làm việc.", Details = ex.Message });
            }
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

            try
            {
                var updated = await _scheduleService.CreateByDoctorIdAsync(doctor.Id, schedules);
                return Ok(updated);
            }
            catch (Exception ex)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Đăng ký lịch làm việc thất bại",
                        $"Đăng ký lịch làm việc thất bại: {ex.Message} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleRegistrationFailed",
                        null
                    );
                }
                catch
                {
                }
                
                return BadRequest(new { Message = ex.Message });
            }
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

            try
            {
                var deleted = await _scheduleService.DeleteByDoctorIdAsync(doctor.Id, scheduleIds);
                return Ok(new { Message = $"{deleted} schedule(s) deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Xóa lịch cố định thất bại",
                        $"Xóa lịch cố định thất bại: {ex.Message} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleDeleteFailed",
                        null
                    );
                }
                catch
                {
                }
                
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Xóa lịch cố định thất bại",
                        $"Xóa lịch cố định thất bại: {ex.Message} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleDeleteFailed",
                        null
                    );
                }
                catch
                {
                }
                
                return StatusCode(500, new { Message = "Có lỗi xảy ra khi xóa lịch làm việc.", Details = ex.Message });
            }
        }
    }
}