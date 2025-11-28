using Medix.API.Application.Util;
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
using System.Numerics;
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
        private const string PatientCancelRefundConfigKey = "APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT";
        private readonly IUserPromotionService userPromotionService;
        private readonly IPromotionService promotionService;
       

        private readonly INotificationService notificationService;


        public AppointmentController(IAppointmentService service, IWalletService walletService, IWalletTransactionService walletTransactionService, IPatientService patientService, IUserService userService, INoticeSetupService noticeSetupService, IEmailService emailService, IDoctorService doctorService, IPatientHealthReminderService patientHealthReminderService, IUserPromotionService userPromotionService, IPromotionService promotionService, ISystemConfigurationService systemConfigurationService, INotificationService notificationService)
        {
            _service = service;
            _walletService = walletService;
            this.walletTransactionService = walletTransactionService;
            _patientService = patientService;
            _userService = userService;
            this.noticeSetupService = noticeSetupService;
            _emailService = emailService;
            _doctorService = doctorService;
            _patientHealthReminderService = patientHealthReminderService;

            this.userPromotionService = userPromotionService;
            this.promotionService = promotionService;
            _systemConfigurationService = systemConfigurationService;
            this.notificationService = notificationService;
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

            if (dto.DoctorId.HasValue && dto.AppointmentStartTime.HasValue && dto.AppointmentEndTime.HasValue)
            {
                var isDoctorBusy = await _service.IsDoctorBusyAsync(
                    dto.DoctorId.Value,
                    dto.AppointmentStartTime.Value,
                    dto.AppointmentEndTime.Value
                );

                if (isDoctorBusy)
                {

                    return BadRequest(new
                    {
                        message = "Bác sĩ đã có lịch hẹn trong khoảng thời gian này",

                    });
                }
            }

            var user = await _userService.GetByIdAsync(userId);
            var doctor = await _doctorService.GetDoctorByIdAsync((Guid)dto.DoctorId);

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
            dto.StatusCode = "BeforeAppoiment";
            dto.TransactionID = transaction.id;


            var created = await _service.CreateAsync(dto);
            WalletTransaction.RelatedAppointmentId = created.Id;

            await walletTransactionService.UppdateWalletTrasactionAsync(WalletTransaction);

            var noticeSetup = await noticeSetupService.GetNoticeSetupByCodeAsync("AppointmentBookingSuccess");
            if (noticeSetup != null) {
                dto.DoctorName = doctor.User.FullName;

                string body=    NoticeUtil.getNoticeBookingAppoinemnt(dto, noticeSetup);
                string header = noticeSetup.TemplateEmailHeader;
             var x=   await _emailService.SendEmailAsync(user.Email, header, body);

            }

            if (dto.PromotionCode != null)
            {
                var promotion = await promotionService.GetPromotionByCodeAsync(dto.PromotionCode);

               promotion.UsedCount += 1;
             
                await promotionService.UpdatePromotionAsync(promotion);
            }

            if (dto.UserPromotionID != null)
            {


                await userPromotionService.DeactivatePromotionAsync(Guid.Parse(dto.UserPromotionID));
            }   
            await _patientHealthReminderService.SendHealthReminderAppointmentAsync(created);
            await notificationService.CreateNotificationAsync(
            doctor.UserId,
              "Thông báo lịch hẹn mới",
                $"Bạn có một lịch hẹn mới từ bệnh nhân {user.FullName} vào lúc {dto.AppointmentStartTime?.ToString("g")}. Vui lòng kiểm tra để chuẩn bị.", "Reminder"

       );

            await notificationService.CreateNotificationAsync(user.Id, "Thông báo lịch hẹn mới", $"Lịch hẹn của bạn vào lúc {dto.AppointmentStartTime?.ToString("g")} đã được sắp xếp. Vui lòng kiểm tra trong Lịch hẹn", "Reminder");


            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id)
        {
       
            var dto = _service.GetByIdAsync(id);
            var updateDto = new UpdateAppointmentDto
            {
                Id = dto.Result.Id,
                AppointmentStartTime = dto.Result.AppointmentStartTime,
                AppointmentEndTime = dto.Result.AppointmentEndTime,
                DurationMinutes = dto.Result.DurationMinutes,
                StatusCode = dto.Result.StatusCode,
                ConsultationFee = dto.Result.ConsultationFee,
                PlatformFee = dto.Result.PlatformFee,
                DiscountAmount = dto.Result.DiscountAmount,
                TotalAmount = dto.Result.TotalAmount,
                PaymentStatusCode = dto.Result.PaymentStatusCode,
                PaymentMethodCode = dto.Result.PaymentMethodCode,
                MedicalInfo = dto.Result.MedicalInfo,
            };
            updateDto.AppointmentStartTime = DateTime.UtcNow.AddHours(7);
            updateDto.AppointmentEndTime = DateTime.UtcNow.AddHours(7).AddMinutes(1);


            var updated = await _service.UpdateAsync(updateDto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }


        [HttpPut("Complete/{id}/{status}")]
        public async Task<IActionResult> Complete(Guid id, string status)
        {
            if (id == null)
            {
                return BadRequest("Mismatched appointment ID");
            }
            var appoint = await _service.GetByIdAsync(id);
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

            var patient = await _patientService.GetByIdAsync((Guid)appoint.PatientID);
            await notificationService.CreateNotificationAsync(
       patient.UserId,
       "Kết quả khám bệnh đã có",
       $"Bác sĩ đã hoàn tất buổi khám lúc {dto.AppointmentStartTime} và cập nhật kết quả. Vui lòng truy cập lịch hẹn để xem chi tiết.",
       "Annouce"
   );
            var updated = await _service.UpdateAsync(dto);

            if (updated == null)
                return NotFound();

            return Ok(updated);



        }


        [HttpPut("UpdateStatus/{id}/{status}")]
        public async Task<IActionResult> Status(Guid id, string status)
        {
          
            var appoint = await _service.GetByIdAsync(id);
          
           

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

        [HttpGet("by-patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(Guid patientId)
        {
            var result = await _service.GetByPatientAsync(patientId);
            return Ok(result);
        }

        [HttpGet("by-date/{date}")]
        public async Task<IActionResult> GetByDate(DateTime date)
        {
            var result = await _service.GetByDateAsync(date);
            return Ok(result);
        }
        [HttpGet("my-day-appointments")]
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
            if (request?.AppointmentId == Guid.Empty)
            {
                return BadRequest(new { message = "Invalid appointment ID" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            var patient = await _patientService.GetPatientByUserIdAsync(userId);
            if (patient == null)
            {
                return NotFound(new { message = "Patient not found" });
            }

            var appointment = await _service.GetByIdAsync(request.AppointmentId);
            if (appointment == null)
            {
                return NotFound(new { message = "Appointment not found" });
            }

            if (appointment.PatientID != patient.Id)
            {
                return Forbid(); 
            }

            if (appointment.StatusCode == "Cancelled" ||
                appointment.StatusCode == "CancelledByPatient" ||
                appointment.StatusCode == "Completed")
            {
                return BadRequest(new { message = $"Cannot cancel appointment with status: {appointment.StatusCode}" });
            }

            var timeUntilAppointment = appointment.AppointmentStartTime - DateTime.UtcNow;
            if (timeUntilAppointment.TotalHours < 2)
            {
                return BadRequest(new { message = "Cannot cancel appointment less than 2 hours before scheduled time" });
            }

            var refundPercentageConfig = await _systemConfigurationService.GetValueAsync<decimal?>(PatientCancelRefundConfigKey);
            var refundPercentage = refundPercentageConfig ?? 0.80m;

            if (refundPercentage > 1m && refundPercentage <= 100m)
            {
                refundPercentage /= 100m;
            }

            if (refundPercentage < 0m) refundPercentage = 0m;
            if (refundPercentage > 1m) refundPercentage = 1m;

            decimal refundAmount = Math.Round(appointment.TotalAmount * refundPercentage, 2);
            decimal cancellationFee = appointment.TotalAmount - refundAmount;
            string refundPercentageDisplay = $"{refundPercentage:P0}";

            var updateAppointment = new UpdateAppointmentDto
            {
                Id = request.AppointmentId,
                StatusCode = "CancelledByPatient",
                AppointmentStartTime = appointment.AppointmentStartTime,
                AppointmentEndTime = appointment.AppointmentEndTime,
                TotalAmount = appointment.TotalAmount,
                PaymentStatusCode = "Refunded",
                RefundAmount = refundAmount,
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

            if (updateResult.PaymentStatusCode == "Refunded")
            {
                var wallet = await _walletService.GetWalletByUserIdAsync(userId);
                if (wallet == null)
                {
                    return StatusCode(500, new { message = "Appointment cancelled but wallet not found for refund" });
                }

                try
                {
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

            return Ok(new
            {
                message = "Appointment cancelled successfully",
                appointmentId = appointment.Id,
                note = "No refund processed as payment was not completed"
            });
        }
    }
    }
