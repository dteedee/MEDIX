using Medix.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HelloController : ControllerBase
    {
        private readonly MedixContext _context;

        public HelloController(MedixContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Get() => Ok(new { message = "Hello from Medix API" });

        [HttpGet("servicetier")]
        public async Task<IActionResult> SerivceTierTest()
        {
            return Ok(await _context.DoctorServiceTiers.ToListAsync());
        }
    }
}


