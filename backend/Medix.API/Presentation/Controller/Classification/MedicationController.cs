using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicationDTO;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicationController : ControllerBase
    {
        private readonly IMedicationService _service;

        public MedicationController(IMedicationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedicationDto>>> GetAll()
        {
            var meds = await _service.GetAllAsync();
            return Ok(meds);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MedicationDto>> GetById(Guid id)
        {
            var med = await _service.GetByIdAsync(id);
            if (med == null)
                return NotFound();

            return Ok(med);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<MedicationSearchDto>>> Search([FromQuery] string query)
        {
            // Chỉ tìm kiếm khi query có ít nhất 2 ký tự để tối ưu
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(Enumerable.Empty<MedicationSearchDto>());
            }

            var results = await _service.SearchAsync(query);
            return Ok(results);
        }

        /// <summary>
        /// Lấy tất cả thuốc (bao gồm cả inactive) - dành cho manager
        /// </summary>
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<MedicationDto>>> GetAllIncludingInactive()
        {
            var meds = await _service.GetAllIncludingInactiveAsync();
            return Ok(meds);
        }

        /// <summary>
        /// Tạo thuốc mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<MedicationDto>> Create([FromBody] MedicationCreateDto dto)
        {
            try
            {
                var created = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Cập nhật thuốc
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<MedicationDto>> Update(Guid id, [FromBody] MedicationUpdateDto dto)
        {
            try
            {
                var updated = await _service.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = "Thuốc không tồn tại." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        /// <summary>
        /// Toggle trạng thái hoạt động (Lock/Unlock)
        /// </summary>
        [HttpPatch("{id}/toggle-active")]
        public async Task<ActionResult> ToggleActive(Guid id)
        {
            try
            {
                var isActive = await _service.ToggleActiveAsync(id);
                return Ok(new { 
                    Id = id, 
                    IsActive = isActive,
                    Message = $"Đã {(isActive ? "kích hoạt" : "tạm dừng")} thuốc."
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = "Thuốc không tồn tại." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }
    }
}
