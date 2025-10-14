using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Medix.API.Exceptions;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Presentation.Controller.UserManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.LoginAsync(loginRequest);
                return Ok(result);
            }
            catch (UnauthorizedException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RegisterAsync(registerRequest);
                return Ok(result);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto forgotPasswordRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await _authService.ForgotPasswordAsync(forgotPasswordRequest);
                return Ok(new { message = "If the email exists, a password reset link has been sent" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password");
                return StatusCode(500, new { message = "An error occurred during forgot password" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto resetPasswordRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await _authService.ResetPasswordAsync(resetPasswordRequest);
                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, new { message = "An error occurred during password reset" });
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto changePasswordRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                await _authService.ChangePasswordAsync(userId, changePasswordRequest);
                return Ok(new { message = "Password has been changed successfully" });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message, errors = ex.Errors });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change");
                return StatusCode(500, new { message = "An error occurred during password change" });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto refreshTokenRequest)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RefreshTokenAsync(refreshTokenRequest);
                return Ok(result);
            }
            catch (UnauthorizedException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                return StatusCode(500, new { message = "An error occurred during token refresh" });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                await _authService.LogoutAsync(userId);
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        [HttpGet("test-jwt")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public IActionResult TestJwt()
        {
            var userId = GetCurrentUserId();
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            return Ok(new 
            { 
                message = "JWT is working!",
                userId = userId,
                email = userEmail,
                role = userRole,
                claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
            });
        }

        [HttpPost("seed-sample-users")]
        public async Task<IActionResult> SeedSampleUsers()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<Medix.API.DataAccess.MedixContext>();
                var userRepository = HttpContext.RequestServices.GetRequiredService<Medix.API.DataAccess.Interfaces.UserManagement.IUserRepository>();
                
                var results = new List<object>();

                // 1. Create roles if not exist
                var adminRole = await context.RefRoles.FirstOrDefaultAsync(r => r.Code == "Admin");
                if (adminRole == null)
                {
                    adminRole = new Medix.API.Models.Enums.RefRole
                    {
                        Code = "Admin",
                        DisplayName = "Quản trị",
                        Description = "Quyền quản trị hệ thống",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    context.RefRoles.Add(adminRole);
                }

                var userRole = await context.RefRoles.FirstOrDefaultAsync(r => r.Code == "User");
                if (userRole == null)
                {
                    userRole = new Medix.API.Models.Enums.RefRole
                    {
                        Code = "User",
                        DisplayName = "Người dùng",
                        Description = "Quyền người dùng tiêu chuẩn",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    context.RefRoles.Add(userRole);
                }

                await context.SaveChangesAsync();

                // 2. Create Admin User
                var adminEmail = "admin@medix.local";
                var existingAdmin = await userRepository.GetByEmailAsync(adminEmail);
                if (existingAdmin == null)
                {
                    var adminUser = new Medix.API.Models.Entities.User
                    {
                        Id = Guid.NewGuid(),
                        UserName = adminEmail,
                        NormalizedUserName = adminEmail.ToUpper(),
                        Email = adminEmail,
                        NormalizedEmail = adminEmail.ToUpper(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                        FullName = "System Admin",
                        EmailConfirmed = true,
                        PhoneNumberConfirmed = false,
                        Status = 1,
                        IsProfileCompleted = false,
                        LockoutEnabled = false,
                        AccessFailedCount = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await userRepository.CreateAsync(adminUser);

                    // Assign Admin role
                    var adminUserRole = new Medix.API.Models.Entities.UserRole
                    {
                        UserId = adminUser.Id,
                        RoleCode = "Admin",
                        CreatedAt = DateTime.UtcNow
                    };
                    context.UserRoles.Add(adminUserRole);

                    results.Add(new { 
                        message = "Admin user created", 
                        email = adminEmail, 
                        password = "Admin@123",
                        role = "Admin"
                    });
                }
                else
                {
                    results.Add(new { 
                        message = "Admin user already exists", 
                        email = adminEmail, 
                        password = "Admin@123",
                        role = "Admin"
                    });
                }

                // 3. Create Normal User
                var userEmail = "user@medix.local";
                var existingUser = await userRepository.GetByEmailAsync(userEmail);
                if (existingUser == null)
                {
                    var normalUser = new Medix.API.Models.Entities.User
                    {
                        Id = Guid.NewGuid(),
                        UserName = userEmail,
                        NormalizedUserName = userEmail.ToUpper(),
                        Email = userEmail,
                        NormalizedEmail = userEmail.ToUpper(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123"),
                        FullName = "Medix User",
                        EmailConfirmed = true,
                        PhoneNumberConfirmed = false,
                        Status = 1,
                        IsProfileCompleted = false,
                        LockoutEnabled = false,
                        AccessFailedCount = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await userRepository.CreateAsync(normalUser);

                    // Assign User role
                    var normalUserRole = new Medix.API.Models.Entities.UserRole
                    {
                        UserId = normalUser.Id,
                        RoleCode = "User",
                        CreatedAt = DateTime.UtcNow
                    };
                    context.UserRoles.Add(normalUserRole);

                    results.Add(new { 
                        message = "Normal user created", 
                        email = userEmail, 
                        password = "User@123",
                        role = "User"
                    });
                }
                else
                {
                    results.Add(new { 
                        message = "Normal user already exists", 
                        email = userEmail, 
                        password = "User@123",
                        role = "User"
                    });
                }

                // 4. Create Test User (for your original curl test)
                var testEmail = "user@example.com";
                var existingTestUser = await userRepository.GetByEmailAsync(testEmail);
                if (existingTestUser == null)
                {
                    var testUser = new Medix.API.Models.Entities.User
                    {
                        Id = Guid.NewGuid(),
                        UserName = testEmail,
                        NormalizedUserName = testEmail.ToUpper(),
                        Email = testEmail,
                        NormalizedEmail = testEmail.ToUpper(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("string"),
                        FullName = "Test User",
                        EmailConfirmed = true,
                        PhoneNumberConfirmed = false,
                        Status = 1,
                        IsProfileCompleted = false,
                        LockoutEnabled = false,
                        AccessFailedCount = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await userRepository.CreateAsync(testUser);

                    // Assign User role
                    var testUserRole = new Medix.API.Models.Entities.UserRole
                    {
                        UserId = testUser.Id,
                        RoleCode = "User",
                        CreatedAt = DateTime.UtcNow
                    };
                    context.UserRoles.Add(testUserRole);

                    results.Add(new { 
                        message = "Test user created", 
                        email = testEmail, 
                        password = "string",
                        role = "User"
                    });
                }
                else
                {
                    results.Add(new { 
                        message = "Test user already exists", 
                        email = testEmail, 
                        password = "string",
                        role = "User"
                    });
                }

                await context.SaveChangesAsync();

                return Ok(new { 
                    message = "Sample users seeding completed", 
                    results = results 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating sample users");
                return StatusCode(500, new { message = "Error creating sample users", error = ex.Message });
            }
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? Guid.Parse(userIdClaim.Value) : Guid.Empty;
        }
    }
}
