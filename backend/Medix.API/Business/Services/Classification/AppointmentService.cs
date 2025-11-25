﻿using AutoMapper;
using Hangfire;
using Humanizer;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IAppointmentRepository _repository;
        private readonly IMapper _mapper;

  

        private readonly IMedicalRecordService medicalRecordService;

        private readonly IWalletService walletService;
        private readonly IWalletTransactionService walletTransactionService;
        private readonly IDoctorRepository doctorRepository;

        private readonly IUserPromotionService userPromotionService;
        private readonly IReviewRepository reviewRepository;

        private readonly IPromotionService promotionService;
        

        public AppointmentService(IAppointmentRepository repository, IMapper mapper, IMedicalRecordService medicalRecordService, IWalletTransactionService walletTransactionService, IWalletService walletService, IDoctorRepository doctorRepository, IUserPromotionService userPromotionService, IPromotionService promotionService, IReviewRepository reviewRepository)
        {
            _repository = repository;
            _mapper = mapper;
            this.medicalRecordService = medicalRecordService;

            this.walletTransactionService = walletTransactionService;
            this.walletService = walletService;
            this.doctorRepository = doctorRepository;
            this.userPromotionService = userPromotionService;
            this.promotionService = promotionService;
            this.reviewRepository = reviewRepository;
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
        }
        public async Task<AppointmentTrendsDto> GetAppointmentTrendsAsync(Guid? doctorId, int year)
        {
            try
            {
                var raw = await _repository.GetMonthlyAppointmentAndRevenueAsync(doctorId, year);

                var monthly = raw.OrderBy(m => m.Month).ToList();

                var result = new AppointmentTrendsDto
                {
                    Year = year,
                    DoctorId = doctorId,
                    Monthly = monthly,
                    TotalAppointments = monthly.Sum(m => m.AppointmentCount),
                    TotalRevenue = monthly.Sum(m => m.TotalRevenue)
                };

                return result;
            }
            catch (Exception ex)
            {
               return null;
            }
        }
        public async Task<AppointmentDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<AppointmentDto>(entity);
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto)
        {
            var entity = _mapper.Map<Appointment>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
        

            await _repository.CreateApppointmentAsync(entity);

            var newRecordDto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = entity.Id,
                ChiefComplaint = dto.chiefComplaint,
                PhysicalExamination = dto.historyOfPresentIllness,
                Diagnosis = "", // có thể để rỗng hoặc "Chưa xác định"
                AssessmentNotes = "",
                TreatmentPlan = "",
                FollowUpInstructions = "",
                DoctorNotes = "",
                Prescriptions = new List<CreatePrescriptionDto>()
            };
        var medical=    await medicalRecordService.CreateAsync(newRecordDto);
            entity.MedicalInfo = medical.Id.ToString();

           
            await _repository.UpdateAsync(entity);

          
            BackgroundJob.Schedule<IAppointmentService>(
                     service => service.CheckisAppointmentCompleted(entity.Id)
                     , entity.AppointmentEndTime.AddMinutes(1));
            return _mapper.Map<AppointmentDto>(entity);
        }

        public async Task<AppointmentDto?> UpdateAsync(UpdateAppointmentDto dto)
        {
            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null) return null;

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;
        
            await _repository.UpdateAsync(existing);
            return _mapper.Map<AppointmentDto>(existing);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDoctorAsync(Guid doctorId)
        {
            var list = await _repository.GetByDoctorAsync(doctorId);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByPatientAsync(Guid patientId)
        {
            var list = await _repository.GetByPatientAsync(patientId);
            var dtos = _mapper.Map<List<AppointmentDto>>(list);

            // Collect appointment IDs for completed appointments
            var completedAppointmentIds = list
                .Where(a => string.Equals(a.StatusCode, "Completed", StringComparison.OrdinalIgnoreCase))
                .Select(a => a.Id)
                .ToList();

            if (completedAppointmentIds.Any())
            {
                // Single DB call to fetch all reviews for those appointments (avoids concurrent DbContext usage)
                var reviews = await reviewRepository.GetByAppointmentIdsAsync(completedAppointmentIds);

                var reviewByAppointment = reviews.ToDictionary(r => r.AppointmentId, r => r);

                // Populate DTOs
                foreach (var dto in dtos.Where(d => string.Equals(d.StatusCode, "Completed", StringComparison.OrdinalIgnoreCase)))
                {
                    if (reviewByAppointment.TryGetValue(dto.Id, out var review))
                    {
                        dto.PatientReview = review.Comment;
                        dto.PatientRating = review.Rating.ToString();
                    }
                }
            }

            return dtos;
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDateAsync(DateTime date)
        {
            var list = await _repository.GetByDateAsync(date);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }
        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateAsync(Guid userId, DateTime date)
        {
            // 1️⃣ Lấy Doctor tương ứng với UserId
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user.");

            // 2️⃣ Tính khoảng thời gian trong ngày
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            // 3️⃣ Lấy các lịch hẹn của bác sĩ trong ngày
            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate);

            // 4️⃣ Map sang DTO
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            // 1. Lấy Doctor tương ứng với UserId
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user.");

            // 2. Lấy các lịch hẹn của bác sĩ trong khoảng thời gian đã cho
            //    Thêm 1 ngày vào endDate để bao gồm tất cả các cuộc hẹn trong ngày cuối cùng.
            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate.AddDays(1));

            // 3. Map sang DTO
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<bool> IsDoctorBusyAsync(Guid doctorId, DateTime appointmentStartTime, DateTime appointmentEndTime)
        {
            // Lấy tất cả lịch hẹn của bác sĩ trong khoảng thời gian này
            var conflictingAppointments = await GetConflictingAppointmentsAsync(doctorId, appointmentStartTime, appointmentEndTime);

            // Nếu có bất kỳ lịch hẹn nào trùng thì bác sĩ đang bận
            return conflictingAppointments.Any();
        }


        public async Task<List<AppointmentDto>> GetConflictingAppointmentsAsync(
            Guid doctorId,
            DateTime appointmentStartTime,
            DateTime appointmentEndTime)
        {
            // Lấy tất cả lịch hẹn của bác sĩ
            var allAppointments = await _repository.GetByDoctorAsync(doctorId);

       var conflictingAppointments = allAppointments.Where(a =>
    // ✅ Chỉ kiểm tra các lịch hẹn CHƯA bị hủy hoặc hoàn thành
             a.StatusCode == "OnProgressing" &&
  // ✅ Kiểm tra trùng thời gian (overlap)
  appointmentStartTime < a.AppointmentEndTime &&
        appointmentEndTime > a.AppointmentStartTime
).ToList();

            return _mapper.Map<List<AppointmentDto>>(conflictingAppointments);
        }
        public async Task CheckisAppointmentCompleted(Guid id)
        {
            var appointment = await _repository.GetByIdAsync(id);
            if (appointment == null) return;

            var doctor = await doctorRepository.GetDoctorByIdAsync(appointment.DoctorId);
            if (doctor == null) return;

      

            var medicalRecord = await medicalRecordService.GetByAppointmentIdAsync(appointment.Id);

            bool hasEnoughMedicalRecord =
                medicalRecord != null &&
                !string.IsNullOrEmpty(medicalRecord.Diagnosis) &&
                !string.IsNullOrEmpty(medicalRecord.AssessmentNotes) &&
                !string.IsNullOrEmpty(medicalRecord.TreatmentPlan) &&
                !string.IsNullOrEmpty(medicalRecord.FollowUpInstructions);

     
            if (hasEnoughMedicalRecord && appointment.StatusCode != "Completed")
            {
                var updateDto = new UpdateAppointmentDto
                {
                    Id = appointment.Id,
                    StatusCode = "Completed",
                    UpdatedAt = DateTime.UtcNow,
                    DiscountAmount = appointment.DiscountAmount,
                    ConsultationFee = appointment.ConsultationFee,
                    DurationMinutes = appointment.DurationMinutes,
                    MedicalInfo = appointment.MedicalInfo,
                    PaymentMethodCode = appointment.PaymentMethodCode,
                    PaymentStatusCode = "Completed",
                    AppointmentEndTime = appointment.AppointmentEndTime,
                    AppointmentStartTime = appointment.AppointmentStartTime,
                    PlatformFee = appointment.PlatformFee,
                    RefundAmount = appointment.RefundAmount,
                    TotalAmount = appointment.TotalAmount
                };

                await UpdateAsync(updateDto);
                return;
            }


            if (!hasEnoughMedicalRecord && appointment.StatusCode != "Completed")
            {
                var updateDto = new UpdateAppointmentDto
                {
                    Id = appointment.Id,
                    StatusCode = "MissedByDoctor",
                    UpdatedAt = DateTime.UtcNow,
                    DiscountAmount = appointment.DiscountAmount,
                    ConsultationFee = appointment.ConsultationFee,
                    DurationMinutes = appointment.DurationMinutes,
                    MedicalInfo = appointment.MedicalInfo,
                    PaymentMethodCode = appointment.PaymentMethodCode,
                    PaymentStatusCode = "Refunded",
                    AppointmentEndTime = appointment.AppointmentEndTime,
                    AppointmentStartTime = appointment.AppointmentStartTime,
                    PlatformFee = appointment.PlatformFee,
                    RefundAmount = appointment.RefundAmount,
                    TotalAmount = appointment.TotalAmount
                };

                await UpdateAsync(updateDto);
                var wallet = await walletService.GetWalletByUserIdAsync(appointment.Patient.User.Id);

                if (wallet == null) return;

                var walletTransaction = new WalletTransactionDto
                {
                    Amount = appointment.TotalAmount,
                    TransactionTypeCode = "AppointmentRefund",
                    Description = "Hoàn lại tiền hủy lịch",
                    CreatedAt = DateTime.UtcNow,
                    orderCode = 0,
                    Status = "Completed",
                    BalanceBefore = wallet.Balance,
                    BalanceAfter = wallet.Balance + appointment.TotalAmount,
                    walletId = wallet.Id
                };

                await walletTransactionService.createWalletTransactionAsync(walletTransaction);
                await walletService.IncreaseWalletBalanceAsync(appointment.Patient.User.Id, appointment.TotalAmount);

                // Increase doctor missed case
                doctor.TotalCaseMissPerWeek += 1;
                await doctorRepository.UpdateDoctorAsync(doctor);

                // Assign promotion to patient
                var promotionForPatient = await promotionService.GetPromotionByCodeAsync("WELCOME50K");
                if (promotionForPatient != null)
                {
                    await userPromotionService.AssignPromotionToUserAsync(appointment.Patient.User.Id, promotionForPatient.Id);
                }
            }
        }


    }
}
