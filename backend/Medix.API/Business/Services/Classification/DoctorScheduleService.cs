using AutoMapper;
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
        public async Task<IEnumerable<DoctorScheduleDto>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<DoctorScheduleDto>>(entities);
        }

        public async Task<DoctorScheduleDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<DoctorScheduleDto>(entity);
        }

        public async Task<DoctorScheduleDto> CreateAsync(CreateDoctorScheduleDto dto)
        {
            // 1️⃣ Lấy toàn bộ lịch của bác sĩ trong cùng ngày
            var existingSchedules = await _repository.GetByDoctorAndDayAsync(dto.DoctorId, dto.DayOfWeek);

            // 2️⃣ Tìm lịch bị trùng
            var overlapping = existingSchedules.FirstOrDefault(s =>
                dto.StartTime < s.EndTime && dto.EndTime > s.StartTime
            );

            if (overlapping != null)
            {
                // Hiển thị cụ thể khung giờ trùng
                throw new InvalidOperationException(
                    $"Bác sĩ đã có lịch từ {overlapping.StartTime:hh\\:mm} đến {overlapping.EndTime:hh\\:mm}. Vui lòng chọn khung giờ khác."
                );
            }

            // 3️⃣ Mapping sang entity mới
            var entity = _mapper.Map<DoctorSchedule>(dto);
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            // 4️⃣ Lưu
            await _repository.AddAsync(entity);

            // 5️⃣ Load lại để có DoctorName
            var reloaded = await _repository.GetByIdAsync(entity.Id);
            return _mapper.Map<DoctorScheduleDto>(reloaded);
        }


        public async Task<DoctorScheduleDto?> UpdateAsync(UpdateDoctorScheduleDto dto)
        {
            var existing = await _repository.GetByIdAsync(dto.Id);
            if (existing == null) return null;

            var schedules = await _repository.GetByDoctorAndDayAsync(dto.DoctorId, dto.DayOfWeek);
            var hasOverlap = schedules
                .Where(s => s.Id != dto.Id) 
                .FirstOrDefault(s =>
                    dto.StartTime < s.EndTime && dto.EndTime > s.StartTime);

            if (hasOverlap != null)
                throw new InvalidOperationException(
                    $"Bác sĩ này đã có lịch từ {hasOverlap.StartTime:HH\\:mm} đến {hasOverlap.EndTime:HH\\:mm} trong ngày {dto.DayOfWeek}."
                );

            _mapper.Map(dto, existing);
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing);
            return _mapper.Map<DoctorScheduleDto>(existing);
        }



        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}
