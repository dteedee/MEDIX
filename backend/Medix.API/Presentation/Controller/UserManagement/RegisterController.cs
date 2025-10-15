using Medix.API.Business.Interfaces.Community;
// using Medix.API.Business.Util; // Removed for performance
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<String> SendEmailVerified([FromBody] string email)
        {
            try
            {
                // Generate 6-digit verification code
                var verificationCode = new Random().Next(100000, 999999).ToString(); // Simple 6-digit code

                // TODO: Store verification code in database with expiration time

                // Send email
                var result = await _emailService.SendVerificationCodeAsync(email, verificationCode);
                return verificationCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendEmailVerified: {ex.Message}");
                return null;
            }
        }

        [HttpPost("resendEmailVerificationCode")]
        public async Task<string> ResendEmailVerificationCode([FromBody] string email)
        {
            try
            {
                // Sinh m� x�c nh?n m?i
                var newCode = new Random().Next(100000, 999999).ToString();

                // TODO: Luu m� x�c nh?n m?i v�o database c�ng th?i gian h?t h?n (n?u c?n)

                // G?i email m� x�c nh?n m?i
                var result = await _emailService.SendVerificationCodeAsync(email, newCode);

                // Tr? v? m� m?i (ho?c true/false n?u kh�ng mu?n tr? m� v? client)
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
        public async Task<IActionResult> RegisterAsync([FromBody] RegistrationPayloadDTO registration)
        {
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
