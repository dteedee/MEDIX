using Microsoft.AspNetCore.Mvc;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Services.Community;
using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ISpecializationService _specializationService;
        private readonly CloudinaryService _cloudinaryService;

        public DoctorController(IDoctorService doctorService, ISpecializationService specializationService, CloudinaryService cloudinaryService)
        {
            _doctorService = doctorService;
            _specializationService = specializationService;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet("specializations")]
        public async Task<ActionResult> GetSpecializations()
        {
            try
            {
                var specializations = await _specializationService.GetAllAsync();
                return Ok(specializations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách chuyên khoa", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<ActionResult> RegisterDoctor([FromForm] DoctorRegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // TODO: Implement doctor registration logic
                await Task.Delay(1); // Placeholder for async operation
                return Ok(new { message = "Đăng ký bác sĩ thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi đăng ký bác sĩ", error = ex.Message });
            }
        }
    }
}