using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelloController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { message = "Medix API is running" });
        }
    }
}
