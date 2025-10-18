using Medix.API.Business.Interfaces.Community;
// using Medix.API.Business.Util; // Removed for performance
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegisterController : ControllerBase
    {
        private readonly MedixContext _context;
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;
        private readonly IPatientService _patientService;
        private readonly IAuthService _authService;

        public RegisterController(MedixContext context, IEmailService emailService, IUserService userService, IPatientService patientService, IAuthService authService)
        {
            _context = context;
            _emailService = emailService;
            _userService = userService;
            _patientService = patientService;
            _authService = authService;
        }

        [HttpGet("getBloodTypes")]
        public List<BloodTypeDTO> GetBloodTypes()
        {
            return _context.RefBloodTypes
                .Distinct()
                .Select(bt => new BloodTypeDTO
                {
                    Code = bt.Code,
                    DisplayName = bt.DisplayName
                })
                .ToList();
        }

        [HttpPost("checkEmailExist")]
        public bool CheckEmailExist([FromBody] string email)
        {
            return _context.Users.Any(p => p.Email == email) || _context.Users.Any(d => d.Email == email);


        }
        [HttpPost("sendEmailVerified")]
        public async Task<string> SendEmailVerified([FromBody] string email)
        {
            try
            {
                var verificationCode = new Random().Next(100000, 999999).ToString();

                // Lưu vào database
                var entity = new EmailVerificationCode
                {
                    Email = email,
                    Code = verificationCode,
                    ExpirationTime = DateTime.UtcNow.AddMinutes(10), // Hết hạn sau 10 phút
                    IsUsed = false
                };
                _context.EmailVerificationCodes.Add(entity);
                await _context.SaveChangesAsync();

                // Gửi email
                var result = await _emailService.SendVerificationCodeAsync(email, verificationCode);
                return verificationCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendEmailVerified: {ex.Message}");
                return null;
            }
        }


        [HttpPost("verifyEmailCode")]
        public async Task<IActionResult> VerifyEmailCode([FromBody] EmailCodeVerifyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { message = "Email và mã xác thực là bắt buộc" });

            var codeEntity = await _context.EmailVerificationCodes
                .Where(e => e.Email == request.Email && e.Code == request.Code)
                .OrderByDescending(e => e.ExpirationTime)
                .FirstOrDefaultAsync();

            if (codeEntity == null)
                return BadRequest(new { message = "Mã xác thực không đúng" });

            if (codeEntity.IsUsed)
                return BadRequest(new { message = "Mã xác thực đã được sử dụng" });

            if (codeEntity.ExpirationTime < DateTime.UtcNow)
                return BadRequest(new { message = "Mã xác thực đã hết hạn" });

            // Đánh dấu đã sử dụng (nếu muốn)
            codeEntity.IsUsed = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác thực thành công" });
        }

        // Request DTO
        public class EmailCodeVerifyRequest
        {
            public string Email { get; set; }
            public string Code { get; set; }
        }

        [HttpPost("resendEmailVerificationCode")]
        public async Task<string> ResendEmailVerificationCode([FromBody] string email)
        {
            try
            {
                var now = DateTime.UtcNow;
                var activeCodes = await _context.EmailVerificationCodes
                    .Where(e => e.Email == email && !e.IsUsed && e.ExpirationTime > now)
                    .ToListAsync();

                foreach (var code in activeCodes)
                {
                    code.IsUsed = true;
                }
                await _context.SaveChangesAsync();
                var newCode = new Random().Next(100000, 999999).ToString();
                var entity = new EmailVerificationCode
                {
                    Email = email,
                    Code = newCode,
                    ExpirationTime = DateTime.UtcNow.AddMinutes(10), // Hết hạn sau 10 phút
                    IsUsed = false
                };
                _context.EmailVerificationCodes.Add(entity);
                await _context.SaveChangesAsync();

                var result = await _emailService.SendVerificationCodeAsync(email, newCode);

       
                return newCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ResendEmailVerificationCode: {ex.Message}");
                return null;
            }
        }

        [HttpPost("checkVNEIDExist")]
        public bool CheckVNEIDExist([FromBody] string vneid)
        {
            return _context.Users.Any(p => p.IdentificationNumber == vneid) || _context.Users.Any(d => d.IdentificationNumber == vneid);


        }


        [HttpPost("registerPatient")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegistrationPayloadDTO  registration)
        { 
            
            if (_context.Users.Any(p => p.Email == registration.RegisterRequest.Email) || _context.Users.Any(d => d.Email == registration.RegisterRequest.Email))
            {
                ModelState.AddModelError("Email", "Email đã được sử dụng");
                return BadRequest(ModelState);
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var userDTO = await _userService.RegisterUserAsync(registration.RegisterRequest);
            var patientDTO = await _patientService.RegisterPatientAsync(registration.PatientDTO, userDTO.Id);
            var loginRequest = new LoginRequestDto
            {
                Email = registration.RegisterRequest.Email,
                Password = registration.RegisterRequest.Password
            };

            var result = await _authService.LoginAsync(loginRequest);
            return Ok(result);
        }
    }
}
