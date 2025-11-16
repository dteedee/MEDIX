﻿using AutoMapper;
using Hangfire;
using Humanizer;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
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

        public AppointmentService(IAppointmentRepository repository, IMapper mapper, IMedicalRecordService medicalRecordService, IWalletTransactionService walletTransactionService, IWalletService walletService, IDoctorRepository doctorRepository)
        {
            _repository = repository;
            _mapper = mapper;
            this.medicalRecordService = medicalRecordService;
           
            this.walletTransactionService = walletTransactionService;
            this.walletService = walletService;
            this.doctorRepository = doctorRepository;
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<AppointmentDto>>(entities);
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
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
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
            var appoiment = await _repository.GetByIdAsync(id);
            var doctor = await doctorRepository.GetDoctorByIdAsync(appoiment.DoctorId);
            var wallet = await walletService.GetWalletByUserIdAsync(doctor.UserId);


            if (DateTime.Now > appoiment.AppointmentEndTime && appoiment.StatusCode != "Completed")
            {
                var updateDto = new UpdateAppointmentDto
                {
                    Id =appoiment.Id,
                    StatusCode = "MissedByDoctor",
                    UpdatedAt = DateTime.UtcNow,
                    DiscountAmount =appoiment.DiscountAmount,
                    ConsultationFee = appoiment.ConsultationFee,
                    DurationMinutes = appoiment.DurationMinutes,
                    MedicalInfo = appoiment.MedicalInfo,
                    PaymentMethodCode = appoiment.PaymentMethodCode,
                    PaymentStatusCode = "Refunded",
                    AppointmentEndTime = appoiment.AppointmentEndTime,
                    AppointmentStartTime = appoiment.AppointmentStartTime,
                    PlatformFee = appoiment.PlatformFee,
                    RefundAmount = appoiment.RefundAmount,
                    TotalAmount = appoiment.TotalAmount
                   
                };

                await UpdateAsync(updateDto);
                    
                var WalletTransaction = new WalletTransactionDto
                {
                    Amount = appoiment.TotalAmount,
                    TransactionTypeCode = "AppointmentRefund",
                    Description = "Hoàn lại tiền hủy lịch ",
                    CreatedAt = DateTime.UtcNow,
                    orderCode = 0,
                    Status = "Completed",
                    BalanceAfter = wallet.Balance,
                    BalanceBefore = wallet.Balance + Decimal.Parse(appoiment.TotalAmount.ToString()),
                    walletId = wallet.Id
                };
                await walletTransactionService.createWalletTransactionAsync(WalletTransaction);

                await walletService.IncreaseWalletBalanceAsync(doctor.UserId, appoiment.TotalAmount);

                doctor.TotalCaseMissPerWeek= doctor.TotalCaseMissPerWeek + 1;

                await doctorRepository.UpdateDoctorAsync(doctor);
            }
        }
           
        }
    }
