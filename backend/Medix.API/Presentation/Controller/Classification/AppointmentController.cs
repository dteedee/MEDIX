using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.ApointmentDTO;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly IAppointmentService _service;

        public AppointmentController(IAppointmentService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppointmentDto dto)
        {
            if (id != dto.Id)
                return BadRequest("Mismatched appointment ID");

            var updated = await _service.UpdateAsync(dto);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
        [HttpGet("by-doctor/{doctorId}")]
        public async Task<IActionResult> GetByDoctor(Guid doctorId)
        {
            var result = await _service.GetByDoctorAsync(doctorId);
            return Ok(result);
        }

        // 🔍 Tìm theo bệnh nhân
        [HttpGet("by-patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(Guid patientId)
        {
            var result = await _service.GetByPatientAsync(patientId);
            return Ok(result);
        }

        // 🔍 Tìm theo ngày
        [HttpGet("by-date/{date}")]
        public async Task<IActionResult> GetByDate(DateTime date)
        {
            var result = await _service.GetByDateAsync(date);
            return Ok(result);
        }
        [HttpGet("my-day-appointments")]
        //[Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetAppointmentsForDoctorByDay([FromQuery] DateTime date)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

                if (userId == null)
                    return Unauthorized(new { Message = "User ID not found in token" });

                var result = await _service.GetByDoctorUserAndDateAsync(Guid.Parse(userId), date);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while fetching appointments.", Details = ex.Message });
            }
        }

    }
}
