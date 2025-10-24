using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/doctor-schedule-overrides")]
    public class DoctorScheduleOverrideController : ControllerBase
    {
        private readonly IDoctorScheduleOverrideService _service;

        public DoctorScheduleOverrideController(IDoctorScheduleOverrideService service)
        {
            _service = service;
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetByDoctor(Guid doctorId)
        {
            var result = await _service.GetByDoctorAsync(doctorId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDoctorScheduleOverrideDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorScheduleOverrideDto dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
        [HttpPut("doctor/{doctorId}")]
        public async Task<IActionResult> UpdateByDoctor(Guid doctorId, [FromBody] List<UpdateDoctorScheduleOverrideDto> dtos)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _service.UpdateByDoctorAsync(doctorId, dtos);
            return Ok(result);
        }
    }
}
