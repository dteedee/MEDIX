using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controllers.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicalRecordController : ControllerBase
    {
        private readonly IMedicalRecordService _service;

        public MedicalRecordController(IMedicalRecordService service)
        {
            _service = service;
        }

        // 🔹 Lấy MedicalRecord theo AppointmentId
        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointment(Guid appointmentId)
        {
            var record = await _service.GetByAppointmentIdAsync(appointmentId);
            if (record == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ bệnh án cho cuộc hẹn này." });

            return Ok(record);
        }

        // 🔹 Tạo mới MedicalRecord (dành cho bệnh nhân chưa có hồ sơ)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrUpdateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(
                nameof(GetByAppointment),
                new { appointmentId = created.AppointmentId },
                created
            );
        }

        // 🔹 Cập nhật MedicalRecord (nếu đã có)
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] CreateOrUpdateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _service.UpdateAsync(dto);
            return Ok(updated);
        }
    }
}
