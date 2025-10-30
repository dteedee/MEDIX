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
    }
}
