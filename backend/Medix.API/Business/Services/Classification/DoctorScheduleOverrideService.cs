﻿﻿﻿﻿﻿using AutoMapper;
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
        private readonly IDoctorScheduleRepository _doctorScheduleRepo; // Added
        private readonly IMapper _mapper;

        public DoctorScheduleOverrideService(
            IDoctorScheduleOverrideRepository repo,
            IAppointmentRepository appointmentRepo,
            IDoctorScheduleRepository doctorScheduleRepo, // Added
            IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
            _appointmentRepo = appointmentRepo;
            _doctorScheduleRepo = doctorScheduleRepo; // Assigned
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
            entity.IsAvailable = true; // Always default IsAvailable to true
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            // Validate overlap with fixed schedules before adding
            await ValidateFixedScheduleOverlap(dto.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<DoctorScheduleOverrideDto> UpdateAsync(Guid id, UpdateDoctorScheduleOverrideDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                throw new Exception("Không tìm thấy bản ghi.");

            // KIỂM TRA BUSINESS RULE: Không cho cập nhật nếu đã có lịch hẹn
            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể cập nhật lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            // Validate overlap with fixed schedules before updating
            await ValidateFixedScheduleOverlap(entity.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            _mapper.Map(dto, entity);
            entity.IsAvailable = true; // IsAvailable và OverrideType là 2 trường khác nhau, IsAvailable luôn mặc định là true khi cập nhật
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);
            await _repo.SaveChangesAsync();

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                return false;

            // KIỂM TRA BUSINESS RULE: Không cho xóa nếu đã có lịch hẹn
            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể xóa lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            await _repo.DeleteAsync(entity);
            await _repo.SaveChangesAsync();
            return true;
        }
        public async Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorAsync(Guid doctorId, List<UpdateDoctorScheduleOverrideDto> dtos)
        {
            // 1️⃣ Lấy danh sách hiện tại
            var existing = await _repo.GetByDoctorIdAsync(doctorId);

            // 2️⃣ Xóa các override không còn trong danh sách gửi lên
            var toDelete = existing
                .Where(e => !dtos.Any(d => e.OverrideDate == d.OverrideDate && e.StartTime == d.StartTime && e.EndTime == d.EndTime))
                .ToList();

            foreach (var del in toDelete)
            {
                // KIỂM TRA BUSINESS RULE: Không cho xóa nếu đã có lịch hẹn
                var hasAppointmentsOnDelete = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(del.DoctorId, del.OverrideDate.ToDateTime(TimeOnly.MinValue), del.StartTime, del.EndTime);
                if (hasAppointmentsOnDelete)
                {
                    throw new InvalidOperationException(
                        $"Không thể xóa lịch ghi đè ({del.StartTime:HH\\:mm} - {del.OverrideDate:dd/MM/yyyy}) vì đã có cuộc hẹn được đặt trong khoảng thời gian này.");
                }
                await _repo.DeleteAsync(del);
            }

            // 3️⃣ Cập nhật hoặc thêm mới
            foreach (var dto in dtos)
            {
                // tìm xem override cùng ngày & giờ đã tồn tại chưa
                var match = existing.FirstOrDefault(e =>
                    e.OverrideDate == dto.OverrideDate &&
                    e.StartTime == dto.StartTime &&
                    e.EndTime == dto.EndTime);

                if (match != null)
                {
                    // KIỂM TRA BUSINESS RULE: Không cho cập nhật nếu đã có lịch hẹn
                    var hasAppointmentsOnUpdate = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(match.DoctorId, match.OverrideDate.ToDateTime(TimeOnly.MinValue), match.StartTime, match.EndTime);
                    if (hasAppointmentsOnUpdate)
                    {
                        // Bỏ qua việc cập nhật nếu đã có lịch hẹn, hoặc ném lỗi tùy theo yêu cầu
                        // Ở đây tôi sẽ ném lỗi để người dùng biết
                        throw new InvalidOperationException(
                            $"Không thể cập nhật lịch ghi đè ({match.StartTime:HH\\:mm} - {match.OverrideDate:dd/MM/yyyy}) vì đã có cuộc hẹn được đặt trong khoảng thời gian này.");
                    }

                    // Validate overlap with fixed schedules before updating
                    await ValidateFixedScheduleOverlap(match.DoctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

                    // update
                    _mapper.Map(dto, match);
                    match.UpdatedAt = DateTime.UtcNow;
                    match.IsAvailable = true; // IsAvailable luôn mặc định là true khi cập nhật
                    await _repo.UpdateAsync(match);
                }
                else
                {
                    // Validate overlap with fixed schedules before adding
                    await ValidateFixedScheduleOverlap(doctorId, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

                    // add new
                    var entity = new DoctorScheduleOverride
                    {
                        Id = Guid.NewGuid(),
                        DoctorId = doctorId,
                        OverrideDate = dto.OverrideDate,
                        StartTime = dto.StartTime,
                        EndTime = dto.EndTime, 
                        IsAvailable = true, // IsAvailable luôn mặc định là true khi thêm mới
                        Reason = dto.Reason,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _repo.AddAsync(entity);
                }
            }

            // 4️⃣ Lưu thay đổi
            await _repo.SaveChangesAsync();

            // 5️⃣ Trả danh sách cập nhật
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

            // Thêm hoặc cập nhật
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

            // Save sau khi xử lý hết vòng lặp
            await _repo.SaveChangesAsync();

            var updated = await _repo.GetByDoctorIdAsync(doctorId.Value);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(updated);
        }


        // 🗑️ 3. Bác sĩ tự xóa override của mình
        public async Task<bool> DeleteByDoctorUserAsync(Guid overrideId, Guid userId)
        {
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
                throw new Exception("Không tìm thấy bác sĩ tương ứng với người dùng hiện tại.");

            var entity = await _repo.GetByIdAsync(overrideId);
            if (entity == null || entity.DoctorId != doctorId.Value)
                return false;

            // KIỂM TRA BUSINESS RULE: Không cho xóa nếu đã có lịch hẹn
            var hasAppointments = await _appointmentRepo.HasAppointmentsInTimeRangeAsync(entity.DoctorId, entity.OverrideDate.ToDateTime(TimeOnly.MinValue), entity.StartTime, entity.EndTime);
            if (hasAppointments)
            {
                throw new InvalidOperationException(
                    $"Không thể xóa lịch ghi đè này vì đã có cuộc hẹn được đặt trong khoảng thời gian từ {entity.StartTime:HH\\:mm} đến {entity.EndTime:HH\\:mm} vào ngày {entity.OverrideDate:dd/MM/yyyy}.");
            }

            await _repo.DeleteAsync(entity);
            await _repo.SaveChangesAsync();
            return true;
        }
        public async Task<DoctorScheduleOverrideDto> CreateByDoctorUserAsync(CreateDoctorScheduleOverrideDto dto, Guid userId)
        {
            // 1️⃣ Lấy DoctorId từ UserId
            var doctorId = await _repo.GetDoctorIdByUserIdAsync(userId);
            if (doctorId == null)
                throw new Exception("Không tìm thấy bác sĩ tương ứng với người dùng hiện tại.");

            // 2️⃣ Kiểm tra trùng (nếu có)
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

            // 3️⃣ Tạo mới override
            var entity = _mapper.Map<DoctorScheduleOverride>(dto);
            entity.Id = Guid.NewGuid();
            entity.DoctorId = doctorId.Value;
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.IsAvailable = true; // IsAvailable luôn mặc định là true khi tạo mới
            entity.OverrideType = dto.OverrideType;

            // Validate overlap with fixed schedules before creating
            await ValidateFixedScheduleOverlap(doctorId.Value, dto.OverrideDate, dto.StartTime, dto.EndTime, dto.OverrideType);

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            // 4️⃣ Trả về DTO
            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        private static bool IsOverlap(TimeOnly startA, TimeOnly endA, TimeOnly startB, TimeOnly endB)
            => startA < endB && endA > startB;

        private async Task ValidateFixedScheduleOverlap(Guid doctorId, DateOnly overrideDate, TimeOnly startTime, TimeOnly endTime, bool overrideType)
        {
            // Chỉ kiểm tra khi là "Tăng ca" (OverrideType = true)
            if (overrideType)
            {
                var dayOfWeek = (int)overrideDate.DayOfWeek; // Sunday = 0, Monday = 1, ...
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
                // Trả về danh sách rỗng nếu không tìm thấy bác sĩ, để client không bị lỗi
                return new List<DoctorScheduleOverrideDto>();
            }

            var list = await _repo.GetByDoctorIdAsync(doctorId.Value);
            return _mapper.Map<List<DoctorScheduleOverrideDto>>(list);
        }

    }

}