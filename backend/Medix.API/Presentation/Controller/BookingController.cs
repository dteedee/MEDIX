using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public BookingController(IDoctorService doctorService)
        {
            _doctorService = doctorService;

        }

        [HttpGet("getDoctor")]
        public IActionResult getDoctor()
        {

            return Ok();

        }
    }
}
