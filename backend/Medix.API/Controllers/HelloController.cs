using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HelloController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { message = "Hello from Medix API" });
    }
}


