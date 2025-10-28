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
        private readonly IMapper _mapper;

        public DoctorScheduleService(IDoctorScheduleRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
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
            if (dayOfWeek < 0 || dayOfWeek > 6)
                throw new InvalidOperationException("Giá trị DayOfWeek không hợp lệ (0–6).");

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
            if (duration.TotalHours != 4)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 4 tiếng.");
            }

            var existingSchedules = await _repository.GetByDoctorAndDayAsync(dto.DoctorId, dto.DayOfWeek);
            var overlapping = existingSchedules.FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

            if (overlapping != null)
            {
                throw new InvalidOperationException(
                    $"Bác sĩ đã có lịch từ {overlapping.StartTime:HH\\:mm} đến {overlapping.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                );
            }
            
            if (existingSchedules.Count() >= 2)
            {
                throw new InvalidOperationException("Mỗi ngày chỉ được đăng ký tối đa 2 ca làm việc.");
            }

            var entity = _mapper.Map<DoctorSchedule>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repository.AddAsync(entity);

            var reloaded = await _repository.GetByIdAsync(entity.Id);
            return _mapper.Map<DoctorScheduleWorkDto>(reloaded);
        }

        // 🟡 Cập nhật
        public async Task<DoctorScheduleWorkDto?> UpdateAsync(UpdateDoctorScheduleDto dto)
        {
            ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);
            
            var duration = dto.EndTime - dto.StartTime;
            if (duration.TotalHours != 4)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 4 tiếng.");
            }

            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null)
                throw new InvalidOperationException("Không tìm thấy lịch bác sĩ cần cập nhật.");

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
            return _mapper.Map<DoctorScheduleWorkDto>(existing);
        }

        // 🔴 Xóa theo ID
        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
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
            if (duration.TotalHours != 4)
            {
                throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 4 tiếng.");
            }

            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null)
                return null;
            // Kiểm tra xem lịch này có đúng là của bác sĩ đang yêu cầu không
            if (existing.DoctorId != doctorId)
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật lịch này.");

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
            return _mapper.Map<DoctorScheduleWorkDto>(existing);
        }

        // 🟢 Tạo nhiều lịch cho 1 bác sĩ
        public async Task<IEnumerable<DoctorScheduleWorkDto>> CreateByDoctorIdAsync(Guid doctorId, IEnumerable<CreateDoctorScheduleDto> schedules)
        {
            var created = new List<DoctorScheduleWorkDto>();
            // Lấy tất cả lịch hiện có của bác sĩ để kiểm tra tổng số ca và trùng lặp
            var allExistingSchedules = (await _repository.GetByDoctorAndDayAsync(doctorId, -1)).ToList();

            foreach (var dto in schedules)
            {
                dto.DoctorId = doctorId;
                ValidateScheduleTime(dto.DayOfWeek, dto.StartTime, dto.EndTime);

                var duration = dto.EndTime - dto.StartTime;
                if (duration.TotalHours != 4)
                {
                    throw new InvalidOperationException("Mỗi ca làm việc phải kéo dài chính xác 4 tiếng.");
                }

                var existing = await _repository.GetByDoctorAndDayAsync(doctorId, dto.DayOfWeek);
                var overlap = existing.FirstOrDefault(s => IsOverlap(dto.StartTime, dto.EndTime, s.StartTime, s.EndTime));

                if (overlap != null)
                    throw new InvalidOperationException(
                        $"Bác sĩ đã có lịch từ {overlap.StartTime:HH\\:mm} đến {overlap.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                    );
                
                // Kiểm tra số lượng ca làm việc trong ngày (bao gồm cả các ca mới được thêm trong cùng batch)
                if (allExistingSchedules.Count(s => s.DayOfWeek == dto.DayOfWeek) + created.Count(s => s.DayOfWeek == dto.DayOfWeek) >= 2)
                {
                    throw new InvalidOperationException($"Mỗi ngày chỉ được đăng ký tối đa 2 ca làm việc. Ngày {dto.DayOfWeek} đã đủ số ca.");
                }
    
                var entity = _mapper.Map<DoctorSchedule>(dto);
                entity.Id = Guid.NewGuid();
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;
    
                await _repository.AddAsync(entity);
    
                var reloaded = await _repository.GetByIdAsync(entity.Id);
                // Thêm vào danh sách created để kiểm tra số lượng ca trong cùng batch
                if (reloaded != null)
                    created.Add(_mapper.Map<DoctorScheduleWorkDto>(reloaded));
            }
    
            return created;
        }

        // 🔴 Xóa nhiều lịch theo bác sĩ
        public async Task<int> DeleteByDoctorIdAsync(Guid doctorId, IEnumerable<Guid> scheduleIds)
        {
            int deleted = 0;
            foreach (var id in scheduleIds)
            {
                var schedule = await _repository.GetByIdAsync(id);
                if (schedule != null && schedule.DoctorId == doctorId)
                {
                    await _repository.DeleteAsync(id);
                    deleted++;
                }
            }
            return deleted;
        }
    }
}
