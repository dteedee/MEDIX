﻿using AutoMapper;
﻿using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorScheduleOverrideService : IDoctorScheduleOverrideService
    {
        private readonly IDoctorScheduleOverrideRepository _repo;
        private readonly IAppointmentRepository _appointmentRepo;
        private readonly IDoctorScheduleRepository _doctorScheduleRepo;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IDoctorRepository _doctorRepository;

        public DoctorScheduleOverrideService(
            IDoctorScheduleOverrideRepository repo,
            IAppointmentRepository appointmentRepo,
            IDoctorScheduleRepository doctorScheduleRepo,
            IMapper mapper,
            INotificationService notificationService,
            IDoctorRepository doctorRepository)
        {
            _repo = repo;
            _mapper = mapper;
            _appointmentRepo = appointmentRepo;
            _doctorScheduleRepo = doctorScheduleRepo;
            _notificationService = notificationService;
            _doctorRepository = doctorRepository;
        }

        public async Task<List<DoctorScheduleOverrideDto>> GetByDoctorAsync(Guid doctorId)
        {
            var list = await _repo.GetByDoctorIdAsync(doctorId);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(list);
        }

        public async Task<DoctorScheduleOverrideDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repo.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<DoctorScheduleOverrideDto> CreateAsync(CreateDoctorScheduleOverrideDto dto)
        {
            var entity = _mapper.Map<DoctorScheduleOverride>(dto);
            entity.IsAvailable = true; 
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await ValidateFixedScheduleOverlap(dto.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(dto.DoctorId);
                if (doctor != null)
                {
                    var overrideTypeText = dto.OverrideType ? "Tăng ca" : "Nghỉ";
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    var dateStr = dto.OverrideDate.ToString("dd/MM/yyyy");
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Đăng ký lịch linh hoạt thành công",
                        $"Bạn đã đăng ký lịch linh hoạt ({overrideTypeText}) thành công vào ngày {dateStr} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleOverride",
                        entity.Id
                    );
                }
            }
            catch (Exception ex)
            {
            }

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<DoctorScheduleOverrideDto> UpdateAsync(Guid id, UpdateDoctorScheduleOverrideDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                throw new Exception("Không tìm thấy bản ghi.");

            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể cập nhật lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            await ValidateFixedScheduleOverlap(entity.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            _mapper.Map(dto, entity);
            entity.IsAvailable = true; 
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);
            await _repo.SaveChangesAsync();

            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(entity.DoctorId);
                if (doctor != null)
                {
                    var overrideTypeText = dto.OverrideType ? "Tăng ca" : "Nghỉ";
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    var dateStr = dto.OverrideDate.ToString("dd/MM/yyyy");
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Cập nhật lịch linh hoạt thành công",
                        $"Bạn đã cập nhật lịch linh hoạt ({overrideTypeText}) vào ngày {dateStr} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleOverrideUpdated",
                        entity.Id
                    );
                }
            }
            catch (Exception ex)
            {
            }

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return false;

            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể xóa lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            var doctorId = entity.DoctorId;
            var overrideDate = entity.OverrideDate;
            var startTime = entity.StartTime;
            var endTime = entity.EndTime;
            var overrideType = entity.OverrideType;

            await _repo.DeleteAsync(entity);
            await _repo.SaveChangesAsync();

            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
                if (doctor != null)
                {
                    var overrideTypeText = overrideType ? "Tăng ca" : "Nghỉ";
                    var timeStr = $"{startTime:HH\\:mm} - {endTime:HH\\:mm}";
                    var dateStr = overrideDate.ToString("dd/MM/yyyy");
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Xóa lịch linh hoạt thành công",
                        $"Bạn đã xóa lịch linh hoạt ({overrideTypeText}) vào ngày {dateStr} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleOverrideDeleted",
                        null
                    );
                }
            }
            catch (Exception ex)
            {
            }

            return true;
        }
        public async Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorAsync(Guid doctorId, List<UpdateDoctorScheduleOverrideDto> dtos)
        {
            var existing = await _repo.GetByDoctorIdAsync(doctorId);

            var toDelete = existing
                .Where(e => !dtos.Any(d => e.OverrideDate == d.OverrideDate && e.StartTime == d.StartTime && e.EndTime == d.EndTime))
                .ToList();

            foreach (var del in toDelete)
            {
                var hasAppointmentsOnDelete = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(del.DoctorId, del.OverrideDate.ToDateTime(TimeOnly.MinValue), del.StartTime, del.EndTime);
                if (hasAppointmentsOnDelete)
                {
                    throw new InvalidOperationException(
                        $"Không thể xóa lịch ghi đè ({del.StartTime:HH\\:mm} - {del.OverrideDate:dd/MM/yyyy}) vì đã có cuộc hẹn được đặt trong khoảng thời gian này.");
                }
                await _repo.DeleteAsync(del);
            }

            foreach (var dto in dtos)
            {
                var match = existing.FirstOrDefault(e =>
                    e.OverrideDate == dto.OverrideDate &&
                    e.StartTime == dto.StartTime &&
                    e.EndTime == dto.EndTime);

                if (match != null)
                {
                    var hasAppointmentsOnUpdate = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(match.DoctorId, match.OverrideDate.ToDateTime(TimeOnly.MinValue), match.StartTime, match.EndTime);
                    if (hasAppointmentsOnUpdate)
                    {
                        throw new InvalidOperationException(
                            $"Không thể cập nhật lịch ghi đè ({match.StartTime:HH\\:mm} - {match.OverrideDate:dd/MM/yyyy}) vì đã có cuộc hẹn được đặt trong khoảng thời gian này.");
                    }

                    await ValidateFixedScheduleOverlap(match.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

                    _mapper.Map(dto, match);
                    match.UpdatedAt = DateTime.UtcNow;
                    match.IsAvailable = true; 
                    await _repo.UpdateAsync(match);
                }
                else
                {
                    await ValidateFixedScheduleOverlap(doctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

                    var entity = new DoctorScheduleOverride
                    {
                        Id = Guid.NewGuid(),
                        DoctorId = doctorId,
                        OverrideDate = dto.OverrideDate,
                        StartTime = dto.StartTime,
                        EndTime = dto.EndTime, 
                        IsAvailable = true,
                        Reason = dto.Reason,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _repo.AddAsync(entity);
                }
            }

            await _repo.SaveChangesAsync();

            var updated = await _repo.GetByDoctorIdAsync(doctorId);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(updated);
        }
        public async Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorUserAsync(
     List<UpdateDoctorScheduleOverrideDto> dtos, Guid userId)
        {
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
                throw new Exception("Không tìm thấy bác sĩ tương ứng với người dùng hiện tại.");

            var existing = await _repo.GetByDoctorIdAsync(doctorId.Value);

            foreach (var dto in dtos)
            {
                if (dto.Id == Guid.Empty)
                {
                    var newEntity = new DoctorScheduleOverride
                    {
                        Id = Guid.NewGuid(),
                        DoctorId = doctorId.Value,
                        OverrideDate = dto.OverrideDate,
                        StartTime = dto.StartTime,
                        EndTime = dto.EndTime,
                        IsAvailable = true,
                        Reason = dto.Reason,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        OverrideType = dto.OverrideType
                    };

                    await _repo.AddAsync(newEntity);
                }
                else
                {
                    var match = existing.FirstOrDefault(e =>
                        e.Id == dto.Id && e.DoctorId == doctorId.Value);

                    if (match != null)
                    {
                        var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(
                            match.DoctorId,
                            match.OverrideDate.ToDateTime(TimeOnly.MinValue),
                            match.StartTime,
                            match.EndTime
                        );

                        if (hasAppointments)
                        {
                            throw new InvalidOperationException(
                                $"Không thể cập nhật lịch ghi đè này vì đã có cuộc hẹn..."
                            );
                        }

                        if (!dto.IsAvailable)
                        {
                            await _repo.DeleteAsync(match);
                        }
                        else
                        {
                            await ValidateFixedScheduleOverlap(
                                doctorId.Value,
                                dto.OverrideDate,
                                dto.StartTime,
                                dto.EndTime,
                                dto.OverrideType
                            );

                            _mapper.Map(dto, match);
                            match.IsAvailable = true;
                            match.UpdatedAt = DateTime.UtcNow;

                            await _repo.UpdateAsync(match);
                        }
                    }
                }
            }

            await _repo.SaveChangesAsync();

            var updated = await _repo.GetByDoctorIdAsync(doctorId.Value);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(updated);
        }


        public async Task<bool> DeleteByDoctorUserAsync(Guid overrideId, Guid userId)
        {
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
                throw new Exception("Không tìm thấy bác sĩ tương ứng với người dùng hiện tại.");

            var entity = await _repo.GetByIdAsync(overrideId);
            if (entity == null || entity.DoctorId != doctorId.Value)
                return false;

            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể xóa lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            var overrideDate = entity.OverrideDate;
            var startTime = entity.StartTime;
            var endTime = entity.EndTime;
            var overrideType = entity.OverrideType;

            await _repo.DeleteAsync(entity);
            await _repo.SaveChangesAsync();

            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId.Value);
                if (doctor != null)
                {
                    var overrideTypeText = overrideType ? "Tăng ca" : "Nghỉ";
                    var timeStr = $"{startTime:HH\\:mm} - {endTime:HH\\:mm}";
                    var dateStr = overrideDate.ToString("dd/MM/yyyy");
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Xóa lịch linh hoạt thành công",
                        $"Bạn đã xóa lịch linh hoạt ({overrideTypeText}) vào ngày {dateStr} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleOverrideDeleted",
                        null
                    );
                }
            }
            catch (Exception ex)
            {
            }

            return true;
        }
        public async Task<DoctorScheduleOverrideDto> CreateByDoctorUserAsync(CreateDoctorScheduleOverrideDto dto, Guid userId)
        {
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
                throw new Exception("Không tìm thấy bác sĩ tương ứng với người dùng hiện tại.");

            var existing = await _repo.GetByDoctorIdAsync(doctorId.Value);
            var overlap = existing.FirstOrDefault(e =>
                e.OverrideDate == dto.OverrideDate &&
                dto.StartTime < e.EndTime &&
                dto.EndTime > e.StartTime
            );

            if (overlap != null)
            {
                throw new InvalidOperationException(
                    $"Bạn đã có ghi đè trong khung giờ {overlap.StartTime:HH\\:mm}-{overlap.EndTime:HH\\:mm} ngày {overlap.OverrideDate}."
                );
            }

            var entity = _mapper.Map<DoctorScheduleOverride>(dto);
            entity.Id = Guid.NewGuid();
            entity.DoctorId = doctorId.Value;
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.IsAvailable = true;
            entity.OverrideType = dto.OverrideType;

            await ValidateFixedScheduleOverlap(doctorId.Value, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            try
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId.Value);
                if (doctor != null)
                {
                    var overrideTypeText = dto.OverrideType ? "Tăng ca" : "Nghỉ";
                    var timeStr = $"{dto.StartTime:HH\\:mm} - {dto.EndTime:HH\\:mm}";
                    var dateStr = dto.OverrideDate.ToString("dd/MM/yyyy");
                    
                    await _notificationService.CreateNotificationAsync(
                        doctor.UserId,
                        "Đăng ký lịch linh hoạt thành công",
                        $"Bạn đã đăng ký lịch linh hoạt ({overrideTypeText}) thành công vào ngày {dateStr} từ {timeStr} vào lúc {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}",
                        "ScheduleOverride",
                        entity.Id
                    );
                }
            }
            catch (Exception ex)
            {
            }

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        private static bool IsOverlap(TimeOnly startA, TimeOnly endA, TimeOnly startB, TimeOnly endB)
            => startA < endB && endA > startB;

        private async Task ValidateFixedScheduleOverlap(Guid doctorId, DateOnly overrideDate, TimeOnly startTime, TimeOnly endTime, bool overrideType)
        {
            if (overrideType)
            {
                var dotNetDayOfWeek = (int)overrideDate.DayOfWeek;
                var dayOfWeek = dotNetDayOfWeek == 0 ? 7 : dotNetDayOfWeek;
                var fixedSchedules = await _doctorScheduleRepo.GetByDoctorAndDayAsync(doctorId, dayOfWeek);

                var isOverlapWithFixed = fixedSchedules.Any(fs =>
                    IsOverlap(startTime, endTime, fs.StartTime, fs.EndTime));

                if (isOverlapWithFixed)
                {
                    throw new InvalidOperationException("Lịch tăng ca không được phép trùng với lịch cố định đã có.");
                }
            }
        }

        public async Task<List<DoctorScheduleOverrideDto>> GetByDoctorUserAsync(Guid userId)
        {
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
            {
                return new List<DoctorScheduleOverrideDto>();
            }

            var list = await _repo.GetByDoctorIdAsync(doctorId.Value);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(list);
        }

    }

}