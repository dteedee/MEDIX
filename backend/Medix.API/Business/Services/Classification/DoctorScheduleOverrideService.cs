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
        public async Task<List<DoctorScheduleOverrideDto>> UpdateByDoctorUserAsync(List<UpdateDoctorScheduleOverrideDto> dtos, Guid userId)
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
                        IsAvailable = dto.IsAvailable,
                        Reason = dto.Reason,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _repo.AddAsync(newEntity);
                }
                else
                {
                    var match = existing.FirstOrDefault(e => e.Id == dto.Id && e.DoctorId == doctorId.Value);
                    if (match != null)
                    {
                        _mapper.Map(dto, match);
                        match.UpdatedAt = DateTime.UtcNow;
                        await _repo.UpdateAsync(match);
                    }
                }
            }

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

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            // 4️⃣ Trả về DTO
            return _mapper.Map<DoctorScheduleOverrideDto>(entity);
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