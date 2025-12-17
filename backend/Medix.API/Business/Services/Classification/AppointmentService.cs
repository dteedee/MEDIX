using AutoMapper;
using Hangfire;
using Humanizer;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.Manager;
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
        private readonly IPatientRepository patientRepository;

        private readonly IUserPromotionService userPromotionService;
        private readonly IReviewRepository reviewRepository;

        private readonly IPromotionService promotionService;
        

        public AppointmentService(IAppointmentRepository repository, IMapper mapper, IMedicalRecordService medicalRecordService, IWalletTransactionService walletTransactionService, IWalletService walletService, IDoctorRepository doctorRepository, IPatientRepository patientRepository, IUserPromotionService userPromotionService, IPromotionService promotionService, IReviewRepository reviewRepository)
        {
            _repository = repository;
            _mapper = mapper;
            this.medicalRecordService = medicalRecordService;

            this.walletTransactionService = walletTransactionService;
            this.walletService = walletService;
            this.doctorRepository = doctorRepository;
            this.patientRepository = patientRepository;
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
            var result = new AppointmentDto
            {AppointmentEndTime = entity.AppointmentEndTime,
                AppointmentStartTime = entity.AppointmentStartTime,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                DiscountAmount = entity.DiscountAmount,
                DurationMinutes = entity.DurationMinutes,
                Id = entity.Id,
                ConsultationFee = entity.ConsultationFee,
                DoctorID = entity.DoctorId,
                MedicalInfo = entity.MedicalInfo,
                PatientID = entity.PatientId,
                PaymentMethodCode = entity.PaymentMethodCode,
                PaymentStatusCode = entity.PaymentStatusCode,
                PlatformFee = entity.PlatformFee,
                RefundAmount = entity.RefundAmount,
                StatusCode = entity.StatusCode,
                TotalAmount = entity.TotalAmount

            };
            return result;
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

            if (!string.IsNullOrWhiteSpace(dto.StatusCode)) existing.StatusCode = dto.StatusCode;
            if (!string.IsNullOrWhiteSpace(dto.PaymentStatusCode)) existing.PaymentStatusCode = dto.PaymentStatusCode;
            if (!string.IsNullOrWhiteSpace(dto.PaymentMethodCode)) existing.PaymentMethodCode = dto.PaymentMethodCode;
            if (!string.IsNullOrWhiteSpace(dto.MedicalInfo)) existing.MedicalInfo = dto.MedicalInfo;

            if (dto.AppointmentStartTime != default) existing.AppointmentStartTime = (DateTime)dto.AppointmentStartTime;
            if (dto.AppointmentEndTime != default) existing.AppointmentEndTime = (DateTime)dto.AppointmentEndTime;
            existing.UpdatedAt = (DateTime)((dto.UpdatedAt != default) ? dto.UpdatedAt : DateTime.UtcNow);

            if (dto.ConsultationFee != default) existing.ConsultationFee = (decimal)dto.ConsultationFee;
            if (dto.TotalAmount != default) existing.TotalAmount = (decimal)dto.TotalAmount;
            if (dto.PlatformFee != default) existing.PlatformFee = (decimal)dto.PlatformFee;
            if (dto.RefundAmount != default) existing.RefundAmount = dto.RefundAmount;
            if (dto.DiscountAmount != default) existing.DiscountAmount = (decimal)dto.DiscountAmount;
            if (dto.DurationMinutes != default) existing.DurationMinutes = (int)dto.DurationMinutes;

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
            var list = (await _repository.GetByPatientAsync(patientId)).ToList();
            var dtos = _mapper.Map<List<AppointmentDto>>(list);

            // Map ChiefComplaint from included MedicalRecord
            for (int i = 0; i < dtos.Count && i < list.Count; i++)
            {
                var appointment = list[i];
                var dto = dtos[i];

                if (appointment.MedicalRecord != null)
                {
                    dto.ChiefComplaint = appointment.MedicalRecord.ChiefComplaint;
                    // Optionally map full record:
                    // dto.MedicalRecord = _mapper.Map<MedicalRecordDto>(appointment.MedicalRecord);
                }
            }

            // Existing review mapping...
            var completedAppointmentIds = list
                .Where(a => string.Equals(a.StatusCode, "Completed", StringComparison.OrdinalIgnoreCase))
                .Select(a => a.Id)
                .ToList();

            if (completedAppointmentIds.Any())
            {
                var reviews = await reviewRepository.GetByAppointmentIdsAsync(completedAppointmentIds);
                var reviewByAppointment = reviews.ToDictionary(r => r.AppointmentId, r => r);

                foreach (var dto in dtos.Where(d => string.Equals(d.StatusCode, "Completed", StringComparison.OrdinalIgnoreCase)))
                {
                    if (reviewByAppointment.TryGetValue(dto.Id, out var review))
                    {
                        dto.PatientReview = review.Comment;
                        dto.PatientRating = review.Rating.ToString();
                    }
                }
            }

            static int GetPriority(string? status) =>
                string.Equals(status, "BeforeAppoiment", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(status, "OnProgressing", StringComparison.OrdinalIgnoreCase)
                    ? 0 : 1;

            // Sort: prioritized statuses first, then by start time (newest first)
            var ordered = dtos
                .OrderBy(d => GetPriority(d.StatusCode))
                .ThenByDescending(d => d.AppointmentStartTime)
                .ToList();

            return ordered;
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDateAsync(DateTime date)
        {
            var list = await _repository.GetByDateAsync(date);
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }
        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateAsync(Guid userId, DateTime date)
        {
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user.");

            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate);

            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetByDoctorUserAndDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
        {
            var doctor = await _repository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                throw new InvalidOperationException("Doctor not found for this user."); 
            var list = await _repository.GetByDoctorAndDateAsync(doctor.Id, startDate, endDate.AddDays(1));
            
            var dtos = _mapper.Map<List<AppointmentDto>>(list);
            var listList = list.ToList();
            for (int i = 0; i < listList.Count && i < dtos.Count; i++)
            {
                var appointment = listList[i];
                var dto = dtos[i];
                
                if (appointment.Patient != null && appointment.Patient.User != null)
                {
                    if (string.IsNullOrEmpty(dto.PatientName))
                        dto.PatientName = appointment.Patient.User.FullName ?? string.Empty;
                    if (string.IsNullOrEmpty(dto.PatientEmail))
                        dto.PatientEmail = appointment.Patient.User.Email ?? string.Empty;
                }
                
                if (appointment.Doctor != null && appointment.Doctor.User != null)
                {
                    if (string.IsNullOrEmpty(dto.DoctorName))
                        dto.DoctorName = appointment.Doctor.User.FullName ?? string.Empty;
                }

                if (appointment.StatusCodeNavigation != null && string.IsNullOrEmpty(dto.StatusDisplayName))
                {
                    dto.StatusDisplayName = appointment.StatusCodeNavigation.DisplayName ?? string.Empty;
                }
                
                if (appointment.PaymentStatusCodeNavigation != null && string.IsNullOrEmpty(dto.PaymentStatusName))
                {
                    dto.PaymentStatusName = appointment.PaymentStatusCodeNavigation.DisplayName ?? string.Empty;
                }
                
                if (appointment.PaymentMethodCodeNavigation != null && string.IsNullOrEmpty(dto.PaymentMethodName))
                {
                    dto.PaymentMethodName = appointment.PaymentMethodCodeNavigation.DisplayName ?? string.Empty;
                }
            }
            
            return dtos;
        }

        public async Task<bool> IsDoctorBusyAsync(Guid doctorId, DateTime appointmentStartTime, DateTime appointmentEndTime)
        {
            var conflictingAppointments = await GetConflictingAppointmentsAsync(doctorId, appointmentStartTime, appointmentEndTime);

            return conflictingAppointments.Any();
        }


        public async Task<List<AppointmentDto>> GetConflictingAppointmentsAsync(
    Guid doctorId,
    DateTime appointmentStartTime,
    DateTime appointmentEndTime)
        {
            var allAppointments = await _repository.GetByDoctorAsync(doctorId);

            var conflictingAppointments = allAppointments.Where(a =>
   
             (a.StatusCode == "BeforeAppoiment"||a.StatusCode== "OnProgressing") &&
  
  appointmentStartTime < a.AppointmentEndTime &&
        appointmentEndTime > a.AppointmentStartTime
).ToList();

            return _mapper.Map<List<AppointmentDto>>(conflictingAppointments);
        }


        public async Task<bool> IsPatientBusyAsync(Guid doctorId, DateTime appointmentStartTime, DateTime appointmentEndTime)
        {
            var conflictingAppointments = await GetConflictingAppointmentsPatientAsync(doctorId, appointmentStartTime, appointmentEndTime);

            return conflictingAppointments.Any();
        }

        public async Task<List<AppointmentDto>> GetConflictingAppointmentsPatientAsync(
Guid patientId,
DateTime appointmentStartTime,
DateTime appointmentEndTime)
        {
            var allAppointments = await _repository.GetByPatientAsync(patientId);

            var conflictingAppointments = allAppointments.Where(a =>

             (a.StatusCode == "BeforeAppoiment" || a.StatusCode == "OnProgressing") &&

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


            if (!hasEnoughMedicalRecord && (appointment.StatusCode == "BeforeAppoiment"||appointment.StatusCode== "OnProgressing"))
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

                doctor.TotalCaseMissPerWeek += 1;
                await doctorRepository.UpdateDoctorAsync(doctor);

                var promotionForPatient = await promotionService.GetPromotionByCodeAsync("WELCOME50K");
                if (promotionForPatient != null)
                {
                    await userPromotionService.AssignPromotionToUserAsync(appointment.Patient.User.Id, promotionForPatient.Id);
                }
            }
        }


    }
}
