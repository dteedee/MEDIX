using Humanizer.Localisation;
using Medix.API.Application.DTO;
using Medix.API.Application.DTOs;
using Medix.API.Application.DTOs.Auth;
using Medix.API.Application.Services;
using Medix.API.Data;
using Medix.API.Utils;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Internal;

namespace Medix.API.Controllers;

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
            var verificationCode = resources.GenerateConfirmationCode();

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
            // Sinh mã xác nhận mới
            var newCode = resources.GenerateConfirmationCode();

            // TODO: Lưu mã xác nhận mới vào database cùng thời gian hết hạn (nếu cần)

            // Gửi email mã xác nhận mới
            var result = await _emailService.SendVerificationCodeAsync(email, newCode);

            // Trả về mã mới (hoặc true/false nếu không muốn trả mã về client)
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
    public async Task<IActionResult> RegisterAsync([FromBody] RegistrationPayload registration)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var userDTO = await _userService.RegisterUserAsync(registration.RegisterDTo);
        var patientDTO = await _patientService.RegisterPatientAsync(registration.PatientDTO, userDTO.Id);
        var loginRequest = new LoginRequestDto
        {
            Email = registration.RegisterDTo.Email,
            Password = registration.RegisterDTo.Password
        };  

        var result = await _authService.LoginAsync(loginRequest);
        return Ok(result);
    }
}