using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.CMSPage;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class CmspageController : ControllerBase
    {
        private readonly ICmspageService _cmspageService;

        public CmspageController(ICmspageService cmspageService)
        {
            _cmspageService = cmspageService;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var pages = await _cmspageService.GetAllAsync();
            return Ok(pages);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var page = await _cmspageService.GetByIdAsync(id);
            if (page == null)
                return NotFound();
            return Ok(page);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CmspageCreateDto request)
        {
            var created = await _cmspageService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, [FromBody] CmspageUpdateDto request)
        {
            var updated = await _cmspageService.UpdateAsync(id, request);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _cmspageService.DeleteAsync(id);
            return Ok();
        }
    }
}