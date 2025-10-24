using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorScheduleOverrideService : IDoctorScheduleOverrideService
    {
        private readonly IDoctorScheduleOverrideRepository _repo;
        private readonly IMapper _mapper;

        public DoctorScheduleOverrideService(
            IDoctorScheduleOverrideRepository repo,
            IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
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
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
        }

        public async Task<DoctorScheduleOverrideDto> UpdateAsync(Guid id, UpdateDoctorScheduleOverrideDto dto)
        {
            var entity = await _repo.GetByIdAsync(id);
            if (entity == null)
                throw new Exception("Không tìm thấy bản ghi.");

            _mapper.Map(dto, entity);
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
                await _repo.DeleteAsync(del);

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
                    // update
                    _mapper.Map(dto, match);
                    match.UpdatedAt = DateTime.UtcNow;
                    await _repo.UpdateAsync(match);
                }
                else
                {
                    // add new
                    var entity = new DoctorScheduleOverride
                    {
                        Id = Guid.NewGuid(),
                        DoctorId = doctorId,
                        OverrideDate = dto.OverrideDate,
                        StartTime = dto.StartTime,
                        EndTime = dto.EndTime,
                        IsAvailable = dto.IsAvailable,
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
    }
}