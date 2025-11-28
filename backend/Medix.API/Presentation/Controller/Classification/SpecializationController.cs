using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Specialization;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Services.Community;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpecializationController : ControllerBase
    {
        private readonly ISpecializationService _specializationService;
        private readonly IDoctorService _doctorService;
        private readonly ILogger<SpecializationController> _logger;
        private readonly CloudinaryService _cloudinaryService;

        public SpecializationController(
            ISpecializationService specializationService,
            IDoctorService doctorService,
            ILogger<SpecializationController> logger,
            CloudinaryService cloudinaryService)
        {
            _specializationService = specializationService;
            _doctorService = doctorService;
            _logger = logger;
            _cloudinaryService = cloudinaryService;
        }
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
                    Overview = specialization.Description, 
                    Services = null, 
                    Technology = null 
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting specialization by id: {Id}", id);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }
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

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] SpecializationCreateDto dto, IFormFile? imageFile)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Code))
                {
                    return BadRequest(new { Message = "Mã chuyên khoa không được để trống." });
                }
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Message = "Tên chuyên khoa không được để trống." });
                }

                var existing = await _specializationService.GetByCodeAsync(dto.Code);
                if (existing != null)
                {
                    return BadRequest(new { Message = "Mã chuyên khoa đã tồn tại." });
                }

                if (imageFile != null && imageFile.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadImageAsync(imageFile);
                    dto.ImageUrl = imageUrl;
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
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] SpecializationUpdateDto dto, IFormFile? imageFile)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Code))
                {
                    return BadRequest(new { Message = "Mã chuyên khoa không được để trống." });
                }
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Message = "Tên chuyên khoa không được để trống." });
                }

                var specialization = await _specializationService.GetByIdAsync(id);
                if (specialization == null)
                {
                    return NotFound(new { Message = "Chuyên khoa không tồn tại." });
                }

                if (specialization.Code != dto.Code)
                {
                    var existing = await _specializationService.GetByCodeAsync(dto.Code);
                    if (existing != null)
                    {
                        return BadRequest(new { Message = "Mã chuyên khoa đã tồn tại." });
                    }
                }

                if (imageFile != null && imageFile.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadImageAsync(imageFile);
                    dto.ImageUrl = imageUrl;
                }
                else if (string.IsNullOrWhiteSpace(dto.ImageUrl))
                {
                    dto.ImageUrl = specialization.ImageUrl;
                }

                specialization.Code = dto.Code;
                specialization.Name = dto.Name;
                specialization.Description = dto.Description;
                specialization.ImageUrl = dto.ImageUrl ?? specialization.ImageUrl; 
                specialization.IsActive = dto.IsActive;
                specialization.UpdatedAt = DateTime.UtcNow;

                var updated = await _specializationService.UpdateAsync(specialization);
                
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

