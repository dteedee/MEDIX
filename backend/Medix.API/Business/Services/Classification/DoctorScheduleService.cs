﻿using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorScheduleService : IDoctorScheduleService
    {
        private readonly IDoctorScheduleRepository _repository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IDoctorRepository _doctorRepository;

        public DoctorScheduleService(
            IDoctorScheduleRepository repository,
            IAppointmentRepository appointmentRepository,
            IMapper mapper,
            INotificationService notificationService,
            IDoctorRepository doctorRepository)
        {
            _repository = repository;
            _appointmentRepository = appointmentRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _doctorRepository = doctorRepository;
        }

        // 🟢 Lấy tất cả
        public async Task<IEnumerable<DoctorScheduleWorkDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<DoctorScheduleWorkDto>>(entities);
        }

        // 🟢 Lấy theo ID
        public async Task<DoctorScheduleWorkDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<DoctorScheduleWorkDto>(entity);
        }

        // 🟢 Validate logic lịch trùng
        private static void ValidateScheduleTime(int dayOfWeek, TimeOnly start, TimeOnly end)
        {
            if (dayOfWeek < 1 || dayOfWeek > 7)
                throw new InvalidOperationException("Giá trị DayOfWeek không hợp lệ (1–7).");

            if (start >= end)
                throw new InvalidOperationException("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
        }

        private static bool IsOverlap(TimeOnly startA, TimeOnly endA, TimeOnly startB, TimeOnly endB)
            => startA < endB && endA > startB;

        // 🟢 Tạo mới
        public async Task<DoctorScheduleWorkDto> CreateAsync(CreateDoctorScheduleDto dto)
        {
            ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);
            
            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalMinutes != 50)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 50 phút.");
            }

            var existingSchedules = await _repository.GetByDoctorAndDayAsync(dto.DoctorId, dto.DayOfWeek);
            var overlapping = existingSchedules.FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

            if (overlapping != null)
            {
                throw new InvalidOperationException(
                    $"Bác sĩ đã có lịch từ {overlapping.StartTime:HH\\:mm} đến {overlapping.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                );
            }
            
          

            var entity = _mapper.Map<DoctorSchedule>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repository.AddAsync(entity);

            var reloaded = await _repository.GetByIdAsync(entity.Id);
            
            // Tạo thông báo khi đăng ký lịch thành công
            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(dto.DoctorId);
                if (doctor != null)
                {
                    var dayNames = new Dictionary<int, string> { { 1, "Thứ hai" }, { 2, "Thứ ba" }, { 3, "Thứ tư" }, { 4, "Thứ năm" }, { 5, "Thứ sáu" }, { 6, "Thứ bảy" }, { 7, "Chủ nhật" } };
                    var dayName = dayNames[dto.DayOfWeek];
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Đăng ký lịch làm việc thành công",
                        $"Bạn đã đăng ký lịch làm việc thành công vào {dayName} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleRegistration",
                        entity.Id
                    );
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo lịch
                // Có thể thêm logging ở đây nếu cần
            }
            
            return _mapper.Map<DoctorScheduleWorkDto>(reloaded);
        }

        // 🟡 Cập nhật
        public async Task<DoctorScheduleWorkDto?> UpdateAsync(UpdateDoctorScheduleDto dto)
        {
            ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);
            
            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalMinutes != 50)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 50 phút.");
            }

            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null)
                throw new InvalidOperationException("Không tìm thấy lịch bác sĩ cần cập nhật.");

            // KIỂM TRA BUSINESS RULE: Không cho cập nhật nếu đã có lịch hẹn trong tương lai
            var hasFutureAppointments = await _appointmentRepository.HasFutureAppointmentsForDoctorOnDay(existing.DoctorId, existing.DayOfWeek);
            if (hasFutureAppointments)
            {
                throw new InvalidOperationException($"Không thể thay đổi lịch làm việc cho ngày này vì đã có lịch hẹn được đặt trong tương lai. Vui lòng sử dụng chức năng 'Ghi đè lịch' (Override) nếu muốn thay đổi đột xuất.");
            }

            var schedules = await _repository.GetByDoctorAndDayAsync(dto.DoctorId, dto.DayOfWeek);
            var hasOverlap = schedules
                .Where(s => s.Id != dto.Id)
                .FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

            if (hasOverlap != null)
            {
                throw new InvalidOperationException(
                    $"Bác sĩ này đã có lịch từ {hasOverlap.StartTime:HH\\:mm} đến {hasOverlap.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                );
            }

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing);

            // Tạo thông báo khi cập nhật lịch cố định thành công
            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(existing.DoctorId);
                if (doctor != null)
                {
                    var dayNames = new Dictionary<int, string> { { 1, "Thứ hai" }, { 2, "Thứ ba" }, { 3, "Thứ tư" }, { 4, "Thứ năm" }, { 5, "Thứ sáu" }, { 6, "Thứ bảy" }, { 7, "Chủ nhật" } };
                    var dayName = dayNames[dto.DayOfWeek];
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Cập nhật lịch cố định thành công",
                        $"Bạn đã cập nhật lịch cố định vào {dayName} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleUpdated",
                        existing.Id
                    );
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến việc cập nhật lịch
            }

            return _mapper.Map<DoctorScheduleWorkDto>(existing);
        }

        // 🔴 Xóa theo ID
        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            // KIỂM TRA BUSINESS RULE: Không cho xóa nếu đã có lịch hẹn trong tương lai
            var hasFutureAppointments = await _appointmentRepository.HasFutureAppointmentsForDoctorOnDay(existing.DoctorId, existing.DayOfWeek);
            if (hasFutureAppointments)
            {
                throw new InvalidOperationException($"Không thể xóa lịch làm việc cho ngày này vì đã có lịch hẹn được đặt trong tương lai. Vui lòng hủy các lịch hẹn trước.");
            }

            // Lưu thông tin trước khi xóa để tạo thông báo
            var doctorId = existing.DoctorId;
            var dayOfWeek = existing.DayOfWeek;
            var startTime = existing.StartTime;
            var endTime = existing.EndTime;

            await _repository.DeleteAsync(id);

            // Tạo thông báo khi xóa lịch cố định thành công
            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
                if (doctor != null)
                {
                    var dayNames = new Dictionary<int, string> { { 1, "Thứ hai" }, { 2, "Thứ ba" }, { 3, "Thứ tư" }, { 4, "Thứ năm" }, { 5, "Thứ sáu" }, { 6, "Thứ bảy" }, { 7, "Chủ nhật" } };
                    var dayName = dayNames[dayOfWeek];
                    var timeStr = $"{startTime:HH\\:mm} - {endTime:HH\\:mm}";
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Xóa lịch cố định thành công",
                        $"Bạn đã xóa lịch cố định vào {dayName} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleDeleted",
                        null
                    );
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến việc xóa lịch
            }

            return true;
        }

        // 🟢 Lấy tất cả lịch theo bác sĩ
        public async Task<IEnumerable<DoctorScheduleWorkDto>> GetByDoctorIdAsync(Guid doctorId)
        {
            var schedules = await _repository.GetByDoctorAndDayAsync(doctorId, -1);
            return _mapper.Map<IEnumerable<DoctorScheduleWorkDto>>(schedules);
        }

       
        public async Task<DoctorScheduleWorkDto?> UpdateSingleByDoctorIdAsync(Guid doctorId, UpdateDoctorScheduleDto dto)
        {
            ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);

            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalMinutes != 50)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 50 phút.");
            }

            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null)
                return null;
            // Kiểm tra xem lịch này có đúng là của bác sĩ đang yêu cầu không
            if (existing.DoctorId != doctorId)
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật lịch này.");

            // KIỂM TRA BUSINESS RULE: Không cho cập nhật nếu đã có lịch hẹn trong tương lai
            var hasFutureAppointments = await _appointmentRepository.HasFutureAppointmentsForDoctorOnDay(doctorId, existing.DayOfWeek);
            if (hasFutureAppointments)
            {
                throw new InvalidOperationException($"Không thể thay đổi lịch làm việc cho ngày này vì đã có lịch hẹn được đặt trong tương lai. Vui lòng sử dụng chức năng 'Ghi đè lịch' (Override) nếu muốn thay đổi đột xuất.");
            }

            // Kiểm tra trùng lặp với các lịch khác của cùng bác sĩ
            var schedules = await _repository.GetByDoctorAndDayAsync(doctorId, dto.DayOfWeek);
            var hasOverlap = schedules
                .Where(s => s.Id != dto.Id) // Loại trừ chính nó
                .FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

            if (hasOverlap != null)
            {
                throw new InvalidOperationException(
                    $"Bác sĩ này đã có lịch từ {hasOverlap.StartTime:HH\\:mm} đến {hasOverlap.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                );
            }

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;
            existing.DoctorId = doctorId; // Đảm bảo DoctorId luôn là của bác sĩ đang đăng nhập

            await _repository.UpdateAsync(existing);

            // Tạo thông báo khi cập nhật lịch cố định thành công
            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
                if (doctor != null)
                {
                    var dayNames = new Dictionary<int, string> { { 1, "Thứ hai" }, { 2, "Thứ ba" }, { 3, "Thứ tư" }, { 4, "Thứ năm" }, { 5, "Thứ sáu" }, { 6, "Thứ bảy" }, { 7, "Chủ nhật" } };
                    var dayName = dayNames[dto.DayOfWeek];
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Cập nhật lịch cố định thành công",
                        $"Bạn đã cập nhật lịch cố định vào {dayName} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleUpdated",
                        existing.Id
                    );
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến việc cập nhật lịch
            }

            return _mapper.Map<DoctorScheduleWorkDto>(existing);
        }

        // 🟢 Tạo nhiều lịch cho 1 bác sĩ
        public async Task<IEnumerable<DoctorScheduleWorkDto>> CreateByDoctorIdAsync(Guid doctorId, IEnumerable<CreateDoctorScheduleDto> schedules)
        {
            var created = new List<DoctorScheduleWorkDto>();
            var createdEntitiesForValidation = new List<DoctorSchedule>(); // Danh sách mới để lưu các entity đã tạo
            // Lấy tất cả lịch hiện có của bác sĩ để kiểm tra tổng số ca và trùng lặp
            var allExistingSchedules = (await _repository.GetByDoctorAndDayAsync(doctorId, -1)).ToList();

            foreach (var dto in schedules)
            {
                dto.DoctorId = doctorId;
                ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);

                var duration = dto.EndTime - dto.StartTime;
                if (duration.TotalMinutes != 50)
                {
                    throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 50 phút.");
                }

                var existing = await _repository.GetByDoctorAndDayAsync(doctorId, dto.DayOfWeek);
                var overlap = existing.FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

                if (overlap != null)
                    throw new InvalidOperationException(
                        $"Bác sĩ đã có lịch từ {overlap.StartTime:HH\\:mm} đến {overlap.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                    );
                
                var entity = _mapper.Map<DoctorSchedule>(dto);
                entity.Id = Guid.NewGuid();
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;
    
                await _repository.AddAsync(entity);
    
                var reloaded = await _repository.GetByIdAsync(entity.Id);
                // Thêm vào danh sách created để kiểm tra số lượng ca trong cùng batch
                if (reloaded != null) {
                    created.Add(_mapper.Map<DoctorScheduleWorkDto>(reloaded));
                    createdEntitiesForValidation.Add(reloaded); // Thêm entity vào danh sách validation
                }
            }
            
            // Tạo thông báo khi đăng ký nhiều lịch thành công
            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
                if (doctor != null && created.Any())
                {
                    var scheduleCount = created.Count();
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Đăng ký lịch làm việc thành công",
                        $"Bạn đã đăng ký thành công {scheduleCount} ca làm việc vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleRegistration",
                        null
                    );
                }
            }
            catch (Exception ex)
            {
                // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo lịch
            }

            // Sau khi thêm, kiểm tra lại toàn bộ lịch
            var finalSchedules = allExistingSchedules.Concat(createdEntitiesForValidation).ToList();
            var schedulesByDay = finalSchedules
                .GroupBy(s => s.DayOfWeek)
                .ToDictionary(g => g.Key, g => g.ToList());

            // foreach (var dayGroup in schedulesByDay)
            // {
            //     if (dayGroup.Value.Count > 0 && dayGroup.Value.Count < 5)
            //     {
            //         throw new InvalidOperationException($"Mỗi ngày làm việc phải có ít nhất 5 ca. Ngày {dayGroup.Key} hiện chỉ có {dayGroup.Value.Count} ca.");
            //     }
            // }
            return created;
        }

        // 🔴 Xóa nhiều lịch theo bác sĩ
        public async Task<int> DeleteByDoctorIdAsync(Guid doctorId, IEnumerable<Guid> scheduleIds)
        {
            int deleted = 0;
            var deletedSchedules = new List<(int dayOfWeek, TimeOnly startTime, TimeOnly endTime)>();
            
            foreach (var id in scheduleIds)
            {
                var schedule = await _repository.GetByIdAsync(id);
                if (schedule != null && schedule.DoctorId == doctorId)
                {
                    // KIỂM TRA BUSINESS RULE: Không cho xóa nếu đã có lịch hẹn trong tương lai
                    var hasFutureAppointments = await _appointmentRepository.HasFutureAppointmentsForDoctorOnDay(doctorId, schedule.DayOfWeek);
                    if (hasFutureAppointments)
                    {
                        throw new InvalidOperationException($"Không thể xóa lịch làm việc (ID: {id}) vì đã có lịch hẹn được đặt trong tương lai cho ngày này.");
                    }

                    // Lưu thông tin lịch đã xóa
                    deletedSchedules.Add((schedule.DayOfWeek, schedule.StartTime, schedule.EndTime));

                    await _repository.DeleteAsync(id);
                    deleted++;
                }
            }

            // Tạo thông báo khi xóa nhiều lịch cố định thành công
            if (deleted > 0)
            {
                try
                {
                    var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
                    if (doctor != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            doctor.UserId,
                            "Xóa lịch cố định thành công",
                            $"Bạn đã xóa thành công {deleted} ca làm việc cố định vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                            "ScheduleDeleted",
                            null
                        );
                    }
                }
                catch (Exception ex)
                {
                    // Log lỗi nhưng không throw để không ảnh hưởng đến việc xóa lịch
                }
            }

            return deleted;
        }
    }
}
