﻿using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly IAppointmentService _service;
        private readonly IWalletService _walletService;
        private readonly IWalletTransactionService walletTransactionService;
        private readonly IPatientService _patientService;
        private readonly IUserService _userService;

        public AppointmentController(IAppointmentService service, IWalletService walletService, IWalletTransactionService walletTransactionService, IPatientService patientService, IUserService userService)
        {
            _service = service;
            _walletService = walletService;
            this.walletTransactionService = walletTransactionService;
            _patientService = patientService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost("appointment-Booking")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            // 1️⃣ Kiểm tra xem bác sĩ có bận trong khoảng thời gian này không
            if (dto.DoctorId.HasValue && dto.AppointmentStartTime.HasValue && dto.AppointmentEndTime.HasValue)
            {
                var isDoctorBusy = await _service.IsDoctorBusyAsync(
                    dto.DoctorId.Value,
                    dto.AppointmentStartTime.Value,
                    dto.AppointmentEndTime.Value
                );

                if (isDoctorBusy)
                {
                    // Lấy danh sách các lịch hẹn bị trùng để thông báo chi tiết
                
                    return BadRequest(new
                    {
                        message = "Bác sĩ đã có lịch hẹn trong khoảng thời gian này",
                   
                    });
                }
            }


            // 2️⃣ Kiểm tra số dư ví
            var patient = await _patientService.GetByUserIdAsync(userId);
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);

            if (wallet != null && wallet.Balance < dto.TotalAmount)
            {
                return BadRequest(new { message = "Insufficient wallet balance" });
            }
            var WalletTransaction = new WalletTransactionDto
            {
                Amount = dto.TotalAmount,
                TransactionTypeCode = "AppointmentPayment",
                Description = "Thanh toán cho đặt bác sĩ ",
                CreatedAt = DateTime.UtcNow,
                orderCode = 0,
                Status = "Completed",
                BalanceAfter = wallet.Balance,
                BalanceBefore = wallet.Balance - Decimal.Parse(dto.TotalAmount.ToString()),
                walletId = wallet.Id
            };
            await walletTransactionService.createWalletTransactionAsync(WalletTransaction);
          

           await _walletService.DecreaseWalletBalanceAsync(wallet.UserId, dto.TotalAmount ?? 0);

            dto.PatientId = patient.Id;
            dto.PaymentMethodCode = "Wallet";
            dto.PaymentStatusCode = "Paid";
            dto.StatusCode = "OnProgressing";
            // 3️⃣ Tạo lịch hẹn
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppointmentDto dto)
        {
            if (id != dto.Id)
                return BadRequest("Mismatched appointment ID");

            var updated = await _service.UpdateAsync(dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
        [HttpGet("by-doctor/{doctorId}")]
        public async Task<IActionResult> GetByDoctor(Guid doctorId)
        {
            var result = await _service.GetByDoctorAsync(doctorId);
            return Ok(result);
        }

        // 🔍 Tìm theo bệnh nhân
        [HttpGet("by-patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(Guid patientId)
        {
            var result = await _service.GetByPatientAsync(patientId);
            return Ok(result);
        }

        // 🔍 Tìm theo ngày
        [HttpGet("by-date/{date}")]
        public async Task<IActionResult> GetByDate(DateTime date)
        {
            var result = await _service.GetByDateAsync(date);
            return Ok(result);
        }
        [HttpGet("my-day-appointments")]
        //[Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetAppointmentsForDoctorByDay([FromQuery] DateTime date)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

                if (userId == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var result = await _service.GetByDoctorUserAndDateAsync(Guid.Parse(userId), date);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching appointments.", Details = ex.Message });
            }
        }

        [HttpGet("my-appointments-by-range")]
        //[Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetMyAppointmentsByRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

                if (userId == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var result = await _service.GetByDoctorUserAndDateRangeAsync(Guid.Parse(userId), startDate, endDate);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching appointments.", Details = ex.Message });
            }
        }

        [HttpGet("patient-appointments")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetAppointmentsForPatientByRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            //try
            //{
            //    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            //                 ?? User.FindFirst("sub")?.Value;
            //    if (userId == null)
            //        return Unauthorized(new { Message = "User ID not found in token" });
            //    var patient = await _patientService.GetByUserIdAsync(Guid.Parse(userId));
            //    if (patient == null)
            //        return NotFound(new { Message = "Patient not found for this user." });
            //    var result = await _service.GetByPatientAndDateRangeAsync(patient.Id, startDate, endDate);
            //    return Ok(result);
            //}
            //catch (Exception ex)
            //{
            //    return StatusCode(500, new { Message = "An error occurred while fetching appointments.", Details = ex.Message });
            //}
        }

    }
}
