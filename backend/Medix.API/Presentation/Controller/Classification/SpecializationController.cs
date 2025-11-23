using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Specialization;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpecializationController : ControllerBase
    {
        private readonly ISpecializationService _specializationService;
        private readonly IDoctorService _doctorService;
        private readonly ILogger<SpecializationController> _logger;

        public SpecializationController(
            ISpecializationService specializationService,
            IDoctorService doctorService,
            ILogger<SpecializationController> logger)
        {
            _specializationService = specializationService;
            _doctorService = doctorService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả chuyên khoa (chỉ active)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = true)
        {
            try
            {
                List<Specialization> specializations;
                
                if (activeOnly)
                {
                    specializations = await _specializationService.GetActiveAsync();
                }
                else
                {
                    specializations = await _specializationService.GetAllAsync();
                }

                // Get doctor count for each specialization
                var distribution = await _specializationService.GetDoctorCountBySpecializationAsync();
                var distributionDict = distribution.ToDictionary(d => d.Id, d => d.DoctorCount);

                var result = specializations.Select(s => new SpecializationListDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    Name = s.Name,
                    Description = s.Description,
                    ImageUrl = s.ImageUrl,
                    DoctorCount = distributionDict.GetValueOrDefault(s.Id, 0),
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                }).OrderByDescending(s => s.DoctorCount).ThenBy(s => s.Name).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting specializations");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Lấy chi tiết chuyên khoa theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var specialization = await _specializationService.GetByIdAsync(id);
                
                if (specialization == null)
                {
                    return NotFound(new { Message = "Chuyên khoa không tồn tại." });
                }

                // Get doctor count
                var distribution = await _specializationService.GetDoctorCountBySpecializationAsync();
                var doctorCount = distribution.FirstOrDefault(d => d.Id == id)?.DoctorCount ?? 0;

                var result = new SpecializationDetailDto
                {
                    Id = specialization.Id,
                    Code = specialization.Code,
                    Name = specialization.Name,
                    Description = specialization.Description,
                    ImageUrl = specialization.ImageUrl,
                    DoctorCount = doctorCount,
                    Overview = specialization.Description, // Có thể mở rộng thêm trường Overview riêng
                    Services = null, // Có thể thêm trường Services vào entity sau
                    Technology = null // Có thể thêm trường Technology vào entity sau
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting specialization by id: {Id}", id);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Lấy chi tiết chuyên khoa theo Code
        /// </summary>
        [HttpGet("code/{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            try
            {
                var specialization = await _specializationService.GetByCodeAsync(code);
                
                if (specialization == null)
                {
                    return NotFound(new { Message = "Chuyên khoa không tồn tại." });
                }

                // Get doctor count
                var distribution = await _specializationService.GetDoctorCountBySpecializationAsync();
                var doctorCount = distribution.FirstOrDefault(d => d.Id == specialization.Id)?.DoctorCount ?? 0;

                var result = new SpecializationDetailDto
                {
                    Id = specialization.Id,
                    Code = specialization.Code,
                    Name = specialization.Name,
                    Description = specialization.Description,
                    ImageUrl = specialization.ImageUrl,
                    DoctorCount = doctorCount,
                    Overview = specialization.Description,
                    Services = null,
                    Technology = null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting specialization by code: {Code}", code);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Tạo chuyên khoa mới
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SpecializationCreateDto dto)
        {
            try
            {
                // Check if code already exists
                var existing = await _specializationService.GetByCodeAsync(dto.Code);
                if (existing != null)
                {
                    return BadRequest(new { Message = "Mã chuyên khoa đã tồn tại." });
                }

                var specialization = new Specialization
                {
                    Id = Guid.NewGuid(),
                    Code = dto.Code,
                    Name = dto.Name,
                    Description = dto.Description,
                    ImageUrl = dto.ImageUrl,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var created = await _specializationService.CreateAsync(specialization);
                
                var result = new SpecializationListDto
                {
                    Id = created.Id,
                    Code = created.Code,
                    Name = created.Name,
                    Description = created.Description,
                    ImageUrl = created.ImageUrl,
                    DoctorCount = 0,
                    IsActive = created.IsActive,
                    CreatedAt = created.CreatedAt,
                    UpdatedAt = created.UpdatedAt
                };

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating specialization");
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Cập nhật chuyên khoa
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] SpecializationUpdateDto dto)
        {
            try
            {
                var specialization = await _specializationService.GetByIdAsync(id);
                if (specialization == null)
                {
                    return NotFound(new { Message = "Chuyên khoa không tồn tại." });
                }

                // Check if code already exists (if changed)
                if (specialization.Code != dto.Code)
                {
                    var existing = await _specializationService.GetByCodeAsync(dto.Code);
                    if (existing != null)
                    {
                        return BadRequest(new { Message = "Mã chuyên khoa đã tồn tại." });
                    }
                }

                specialization.Code = dto.Code;
                specialization.Name = dto.Name;
                specialization.Description = dto.Description;
                specialization.ImageUrl = dto.ImageUrl;
                specialization.IsActive = dto.IsActive;
                specialization.UpdatedAt = DateTime.UtcNow;

                var updated = await _specializationService.UpdateAsync(specialization);
                
                // Get doctor count
                var distribution = await _specializationService.GetDoctorCountBySpecializationAsync();
                var doctorCount = distribution.FirstOrDefault(d => d.Id == id)?.DoctorCount ?? 0;

                var result = new SpecializationListDto
                {
                    Id = updated.Id,
                    Code = updated.Code,
                    Name = updated.Name,
                    Description = updated.Description,
                    ImageUrl = updated.ImageUrl,
                    DoctorCount = doctorCount,
                    IsActive = updated.IsActive,
                    CreatedAt = updated.CreatedAt,
                    UpdatedAt = updated.UpdatedAt
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating specialization: {Id}", id);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Toggle trạng thái hoạt động của chuyên khoa (Lock/Unlock)
        /// </summary>
        [HttpPatch("{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            try
            {
                var specialization = await _specializationService.GetByIdAsync(id);
                if (specialization == null)
                {
                    return NotFound(new { Message = "Chuyên khoa không tồn tại." });
                }

                specialization.IsActive = !specialization.IsActive;
                specialization.UpdatedAt = DateTime.UtcNow;

                var updated = await _specializationService.UpdateAsync(specialization);
                
                return Ok(new { 
                    Id = updated.Id, 
                    IsActive = updated.IsActive,
                    Message = $"Đã {(updated.IsActive ? "kích hoạt" : "tạm dừng")} chuyên khoa."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling specialization active status: {Id}", id);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }
    }
}

