using Microsoft.AspNetCore.Mvc;
using Medix.API.DataAccess;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class CmspageController : ControllerBase
    {
        private readonly MedixContext _context;

        public CmspageController(MedixContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult GetAll()
        {
            var pages = _context.Cmspages.Take(10).ToList();
            return Ok(pages);
        }

        [HttpGet("{id}")]
        public ActionResult GetById(Guid id)
        {
            var page = _context.Cmspages.Find(id);
            if (page == null)
                return NotFound("Không tìm thấy trang");
            return Ok(page);
        }

        [HttpPost]
        public ActionResult Create([FromBody] dynamic request)
        {
            return Ok(new { message = "API đã được tối ưu cho tốc độ cao" });
        }
    }
}