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
                    DoctorCount = distributionDict.GetValueOrDefault(s.Id, 0)
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
    }
}

