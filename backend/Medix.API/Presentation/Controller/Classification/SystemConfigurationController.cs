using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemConfigurationController : ControllerBase
    {
        private readonly ISystemConfigurationService _service;

        public SystemConfigurationController(ISystemConfigurationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var configs = await _service.GetAllAsync();
            return Ok(configs);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var config = await _service.GetByKeyAsync(key);
            return config != null ? Ok(config) : NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] SystemConfigurationRequest request)
        {
            await _service.AddAsync(request, "admin");
            return Ok("Configuration added successfully.");
        }
        [HttpPut("{key}")]
        public async Task<IActionResult> Update(string key, [FromBody] UpdateConfigurationValueRequest req)
        {
            await _service.UpdateAsync(key, req.Value, "admin");
            return Ok("Configuration updated successfully.");
        }


        [HttpDelete("{key}")]
        public async Task<IActionResult> Delete(string key)
        {
            await _service.DeleteAsync(key);
            return Ok("Configuration deleted successfully.");
        }
        [HttpGet("password-policy")]
        public async Task<IActionResult> GetPasswordPolicy()
        {
            var policy = await _service.GetPasswordPolicyAsync();
            return Ok(policy);
        }
    }
}
