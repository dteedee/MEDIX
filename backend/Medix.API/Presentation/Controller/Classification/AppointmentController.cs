﻿using Medix.API.Application.Util;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.MedicalRecordDTO;
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
        private readonly INoticeSetupService noticeSetupService;
        private readonly IEmailService _emailService;
        private readonly IDoctorService _doctorService;
        private readonly IPatientHealthReminderService _patientHealthReminderService;
        private readonly ISystemConfigurationService _systemConfigurationService;
        private readonly IUserPromotionService _userPromotionService;
        private readonly IPromotionService _promotionService;
        private const string PatientCancelRefundConfigKey = "APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT";

        public AppointmentController(
            IAppointmentService service,
            IWalletService walletService,
            IWalletTransactionService walletTransactionService,
            IPatientService patientService,
            IUserService userService,
            INoticeSetupService noticeSetupService,
            IEmailService emailService,
            IDoctorService doctorService,
            IPatientHealthReminderService patientHealthReminderService,
            ISystemConfigurationService systemConfigurationService,
            IUserPromotionService userPromotionService,
            IPromotionService promotionService)
        {
            _service = service;
            _walletService = walletService;
            this.walletTransactionService = walletTransactionService; // 'this' is redundant here but acceptable
            _patientService = patientService;
            _userService = userService;
            this.noticeSetupService = noticeSetupService;
            _emailService = emailService;
            _doctorService = doctorService;
            _patientHealthReminderService = patientHealthReminderService;
            _systemConfigurationService = systemConfigurationService;
            _userPromotionService = userPromotionService;
            _promotionService = promotionService;
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

            var user = await _userService.GetByIdAsync(userId);
            var doctor = await _doctorService.GetDoctorByIdAsync((Guid)dto.DoctorId);

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
            var transaction = await walletTransactionService.createWalletTransactionAsync(WalletTransaction);


            await _walletService.DecreaseWalletBalanceAsync(wallet.UserId, dto.TotalAmount ?? 0);

            dto.PatientId = patient.Id;
            dto.PaymentMethodCode = "Wallet";
            dto.PaymentStatusCode = "Paid";
            dto.StatusCode = "OnProgressing";
            dto.TransactionID = transaction.id;


            // 3️⃣ Tạo lịch hẹn
            var created = await _service.CreateAsync(dto);
          

            var noticeSetup = await noticeSetupService.GetNoticeSetupByCodeAsync("AppointmentBookingSuccess");
            if (noticeSetup != null) {
                dto.DoctorName = doctor.User.FullName;

                string body=    NoticeUtil.getNoticeBookingAppoinemnt(dto, noticeSetup);
                string header = noticeSetup.TemplateEmailHeader;
             var x=   await _emailService.SendEmailAsync(user.Email, header, body);

            }

            if (dto.PromotionCode != null)
            {
                var promotion = await _promotionService.GetPromotionByCodeAsync(dto.PromotionCode);

               promotion.UsedCount += 1;
             
                await _promotionService.UpdatePromotionAsync(promotion);
            }

            if (dto.UserPromotionID != null)
            {


                await _userPromotionService.DeactivatePromotionAsync(Guid.Parse(dto.UserPromotionID));
            }   
            await _patientHealthReminderService.SendHealthReminderAppointmentAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppointmentDto? dto)
        {
            if (id != dto.Id)
                return BadRequest("Mismatched appointment ID");
            dto.AppointmentStartTime = DateTime.Now;
            dto.AppointmentEndTime = DateTime.Now.AddHours(1);

            var updated = await _service.UpdateAsync(dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }


        [HttpPut("Complete/{id}/{status}")]
        public async Task<IActionResult> Complete(Guid id,string status)
        {
            if (id == null)
            {
                return BadRequest("Mismatched appointment ID");
            }
       var appoint =   await _service.GetByIdAsync(id);
            var allowedCompleteTime = appoint.AppointmentEndTime.AddMinutes(10);
            if (DateTime.Now < allowedCompleteTime)
            {
                return BadRequest("Vui lòng chờ đợi đến giờ xác nhận");
            }

            var dto = new UpdateAppointmentDto
            {
                Id = appoint.Id,
                AppointmentStartTime = appoint.AppointmentStartTime,
                AppointmentEndTime = appoint.AppointmentEndTime,
                DurationMinutes = appoint.DurationMinutes,
                StatusCode = status,
                ConsultationFee = appoint.ConsultationFee,
                PlatformFee = appoint.PlatformFee,
                DiscountAmount = appoint.DiscountAmount,
                TotalAmount = appoint.TotalAmount,
                PaymentStatusCode = appoint.PaymentStatusCode,
                PaymentMethodCode = appoint.PaymentMethodCode,
                MedicalInfo = appoint.MedicalInfo,
            };


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
        [Authorize(Roles = "Doctor")]
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
        public async Task<IActionResult> GetAppointments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });
            var patient = await _patientService.GetPatientByUserIdAsync(userId);
            if (patient != null)
            {
                var result = await _service.GetByPatientAsync(patient.Id);
                return Ok(result);
            }


            return BadRequest();
        }


        [HttpPatch("cancel-patient-appointments")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> CancelAppointment([FromBody] CancelAppointmentRequest request)
        {
            // 1️⃣ Validate input
            if (request?.AppointmentId == Guid.Empty)
            {
                return BadRequest(new { message = "Invalid appointment ID" });
            }

            // 2️⃣ Get user from token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            // 3️⃣ Get patient info
            var patient = await _patientService.GetPatientByUserIdAsync(userId);
            if (patient == null)
            {
                return NotFound(new { message = "Patient not found" });
            }

            // 4️⃣ Get appointment
            var appointment = await _service.GetByIdAsync(request.AppointmentId);
            if (appointment == null)
            {
                return NotFound(new { message = "Appointment not found" });
            }

            // 5️⃣ Verify ownership
            if (appointment.PatientID != patient.Id)
            {
                return Forbid(); // 403 - Patient không sở hữu appointment này
            }

            // 6️⃣ Check if appointment can be cancelled
            if (appointment.StatusCode == "Cancelled" ||
                appointment.StatusCode == "CancelledByPatient" ||
                appointment.StatusCode == "Completed")
            {
                return BadRequest(new { message = $"Cannot cancel appointment with status: {appointment.StatusCode}" });
            }

            // 7️⃣ Check if appointment is too close
            var timeUntilAppointment = appointment.AppointmentStartTime - DateTime.UtcNow;
            if (timeUntilAppointment.TotalHours < 2)
            {
                return BadRequest(new { message = "Cannot cancel appointment less than 2 hours before scheduled time" });
            }

            // 8️⃣ Calculate refund amount (configurable)
            var refundPercentageConfig = await _systemConfigurationService.GetValueAsync<decimal?>(PatientCancelRefundConfigKey);
            var refundPercentage = refundPercentageConfig ?? 0.80m;

            // allow admins to store 0-100 or 0-1
            if (refundPercentage > 1m && refundPercentage <= 100m)
            {
                refundPercentage /= 100m;
            }

            if (refundPercentage < 0m) refundPercentage = 0m;
            if (refundPercentage > 1m) refundPercentage = 1m;

            decimal refundAmount = Math.Round(appointment.TotalAmount * refundPercentage, 2);
            decimal cancellationFee = appointment.TotalAmount - refundAmount;
            string refundPercentageDisplay = $"{refundPercentage:P0}";

            // 9️⃣ Update appointment status
            var updateAppointment = new UpdateAppointmentDto
            {
                Id = request.AppointmentId,
                StatusCode = "CancelledByPatient",
                AppointmentStartTime = appointment.AppointmentStartTime,
                AppointmentEndTime = appointment.AppointmentEndTime,
                TotalAmount = appointment.TotalAmount,
                PaymentStatusCode = "Refunded",
                RefundAmount = refundAmount, // ✅ 80% of total
                RefundStatus = "Completed",
                ConsultationFee = appointment.ConsultationFee,
                DiscountAmount = appointment.DiscountAmount,
                PlatformFee = appointment.PlatformFee,
                DurationMinutes = appointment.DurationMinutes,
                MedicalInfo = appointment.MedicalInfo,
                PaymentMethodCode = appointment.PaymentMethodCode,
            };

            var updateResult = await _service.UpdateAsync(updateAppointment);
            if (updateResult == null)
            {
                return StatusCode(500, new { message = "Unable to cancel appointment" });
            }

            // 🔟 Process refund if payment was made
            if (updateResult.PaymentStatusCode == "Refunded")
            {
                var wallet = await _walletService.GetWalletByUserIdAsync(userId);
                if (wallet == null)
                {
                    return StatusCode(500, new { message = "Appointment cancelled but wallet not found for refund" });
                }

                try
                {
                    // Create refund transaction with configured amount
                    var walletTransaction = new WalletTransactionDto
                    {
                        Amount = refundAmount,
                        TransactionTypeCode = "AppointmentRefund",
                        Description = $"Hoàn tiền hủy lịch hẹn #{appointment.Id} ({refundPercentageDisplay} - Phí hủy: {cancellationFee:N0} VND)",
                        CreatedAt = DateTime.UtcNow,
                        orderCode = 0,
                        Status = "Completed",
                        BalanceBefore = wallet.Balance,
                        BalanceAfter = wallet.Balance + refundAmount,
                        walletId = wallet.Id,
                        RelatedAppointmentId = appointment.Id
                    };

                    var transaction = await walletTransactionService.createWalletTransactionAsync(walletTransaction);

                    // Increase wallet balance with 80% refund
                    await _walletService.IncreaseWalletBalanceAsync(wallet.UserId, refundAmount);

                    return Ok(new
                    {
                        message = "Appointment cancelled and refunded successfully",
                        appointmentId = appointment.Id,
                        totalAmount = appointment.TotalAmount,
                        refundAmount = refundAmount,
                        cancellationFee = cancellationFee,
                        refundPercentage = refundPercentageDisplay,
                        note = $"Phí hủy lịch {(1 - refundPercentage):P0} đã được trừ",
                        transactionId = transaction.id
                    });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        message = "Appointment cancelled but refund failed. Please contact support.",
                        appointmentId = appointment.Id,
                        error = ex.Message
                    });
                }
            }

            // ⚠️ No refund needed (appointment not paid yet)
            return Ok(new
            {
                message = "Appointment cancelled successfully",
                appointmentId = appointment.Id,
                note = "No refund processed as payment was not completed"
            });
        }
    }
    }
