using Google.Apis.Auth;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.Authen;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Medix.API.Business.Services.UserManagement
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly DataAccess.MedixContext _context;
        private readonly ISystemConfigurationService _configService;


        private readonly IWalletService _walletService;

        public AuthService(
            IUserRepository userRepository,
            IJwtService jwtService,
            IEmailService emailService,
            IUserRoleRepository userRoleRepository,
            IPatientRepository patientRepository,
            DataAccess.MedixContext context,
            IWalletService walletService,
            ISystemConfigurationService configurationService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _emailService = emailService;
            _userRoleRepository = userRoleRepository;
            _patientRepository = patientRepository;
            _context = context;
            _walletService = walletService;
            _configService = configurationService;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            var identifier = loginRequest.Identifier?.Trim();
            User? user = null;

            if (!string.IsNullOrEmpty(identifier))
            {
                if (identifier.Contains("@"))
                    user = await _userRepository.GetByEmailAsync(identifier);
                else
                    user = await _userRepository.GetByUserNameAsync(identifier);
            }

            if (user == null)
                throw new UnauthorizedException("Tên đăng nhập/Email hoặc mật khẩu không đúng");

            if (user.LockoutEnabled)
                throw new UnauthorizedException("Tài khoản bị khóa, vui lòng liên hệ bộ phận hỗ trợ");

            if (user.LockoutEnd != null && user.LockoutEnd > DateTime.UtcNow)
            {
                var vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                DateTime lockoutEndVN = TimeZoneInfo.ConvertTimeFromUtc(user.LockoutEnd.Value, vnTimeZone);

                throw new UnauthorizedException(
                    $"Tài khoản bị khóa đến {lockoutEndVN:HH:mm dd/MM/yyyy}"
                );
            }


            int? maxAttempts = await _configService.GetIntValueAsync("MaxFailedLoginAttempts");
            int? lockMinutes = await _configService.GetIntValueAsync("AccountLockoutDurationMinutes");

            int maxFailedAttempts = maxAttempts ?? 5;
            int lockDuration = lockMinutes ?? 15;

            if (!BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
            {
                user.AccessFailedCount++;

                if (user.AccessFailedCount >= maxFailedAttempts)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(lockDuration);
                    await _userRepository.UpdateAsync(user);

                    throw new UnauthorizedException(
                        $"Nhập sai quá {maxFailedAttempts} lần. Tài khoản bị khóa trong {lockDuration} phút."
                    );
                }

                await _userRepository.UpdateAsync(user);
                throw new UnauthorizedException("Tên đăng nhập/Email hoặc mật khẩu không đúng");
            }

            user.AccessFailedCount = 0;
            user.LockoutEnd = null;
            await _userRepository.UpdateAsync(user);

            var roleEntity = await _userRoleRepository.GetByIdAsync(user.Id);
            var roleCode = roleEntity?.RoleCode ?? user.Role ?? "Patient";

            var accessToken = _jwtService.GenerateAccessToken(user, new List<string> { roleCode });
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refreshEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshEntity);
            await _context.SaveChangesAsync();

            // Get actual token expiration time from configuration
            var expiryMinutes = await _configService.GetIntValueAsync("JWT_EXPIRY_MINUTES") ?? 30;
            var tokenExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = tokenExpiresAt,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = roleCode,
                    CreatedAt = user.CreatedAt,
                    AvatarUrl = user.AvatarUrl,
                    UserName = user.UserName
                }
            };
        }


        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerRequest)
        {
            await _configService.ValidatePasswordAsync(registerRequest.Password);

            var existingUser = await _userRepository.GetByEmailAsync(registerRequest.Email);
            if (existingUser != null)
            {
                throw new ValidationException(new Dictionary<string, string[]>
        {
            { "Email", new[] { "Email đã được sử dụng" } }
        });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = registerRequest.Email,
                NormalizedUserName = registerRequest.Email.ToUpper(),
                Email = registerRequest.Email,
                NormalizedEmail = registerRequest.Email.ToUpper(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password),
                FullName = $"{registerRequest.FirstName} {registerRequest.LastName}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);

            await _userRoleRepository.AssignRole("Patient", user.Id);

            var accessToken = _jwtService.GenerateAccessToken(user, new List<string> { "Patient" });
            var refreshToken = _jwtService.GenerateRefreshToken();

            _context.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });

            await _context.SaveChangesAsync();

            // Get actual token expiration time from configuration
            var expiryMinutes = await _configService.GetIntValueAsync("JWT_EXPIRY_MINUTES") ?? 30;
            var tokenExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = tokenExpiresAt,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = "Patient",
                    CreatedAt = user.CreatedAt,
                    UserName = user.UserName
                }
            };
        }


        public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto refreshTokenRequest)
        {
            const int maxRetries = 3;
            int retryCount = 0;

            while (retryCount < maxRetries)
            {
                try
                {
                    // Use transaction with serializable isolation to prevent concurrent access
                    using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                    try
                    {
                        // Load token with user - the transaction will lock the row
                        var storedToken = await _context.RefreshTokens
                            .Include(r => r.User)
                            .FirstOrDefaultAsync(r => r.Token == refreshTokenRequest.RefreshToken);

                        if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
                        {
                            await transaction.RollbackAsync();
                            throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
                        }

                        var user = storedToken.User;
                        var roleEntity = await _userRoleRepository.GetByIdAsync(user.Id);
                        var roleCode = roleEntity?.RoleCode ?? user.Role ?? "Patient";

                        var newAccessToken = _jwtService.GenerateAccessToken(user, new List<string> { roleCode });
                        var newRefreshToken = _jwtService.GenerateRefreshToken();

                        // Remove old token
                        _context.RefreshTokens.Remove(storedToken);

                        // Add new token
                        var newTokenEntity = new RefreshToken
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Token = newRefreshToken,
                            CreatedAt = DateTime.UtcNow,
                            ExpiresAt = DateTime.UtcNow.AddDays(7)
                        };

                        _context.RefreshTokens.Add(newTokenEntity);
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // Get actual token expiration time from configuration
                        var expiryMinutes = await _configService.GetIntValueAsync("JWT_EXPIRY_MINUTES") ?? 30;
                        var tokenExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

                        return new AuthResponseDto
                        {
                            AccessToken = newAccessToken,
                            RefreshToken = newRefreshToken,
                            ExpiresAt = tokenExpiresAt,
                            User = new UserDto
                            {
                                Id = user.Id,
                                Email = user.Email,
                                FullName = user.FullName,
                                Role = roleCode,
                                EmailConfirmed = user.EmailConfirmed,
                                CreatedAt = user.CreatedAt,
                                UserName = user.UserName,
                                IsTemporaryUsername = user.UserName.StartsWith("temp_")
                            }
                        };
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        await transaction.RollbackAsync();
                        
                        // Check if token was already used (another request succeeded)
                        var tokenStillExists = await _context.RefreshTokens
                            .AnyAsync(r => r.Token == refreshTokenRequest.RefreshToken);
                        
                        if (!tokenStillExists)
                        {
                            throw new UnauthorizedException("Refresh token đã được sử dụng. Vui lòng đăng nhập lại.");
                        }
                        
                        retryCount++;
                        
                        if (retryCount >= maxRetries)
                        {
                            throw new UnauthorizedException("Không thể làm mới token. Vui lòng thử lại sau.");
                        }
                        
                        // Wait a bit before retry (exponential backoff)
                        await Task.Delay(100 * retryCount);
                        continue;
                    }
                }
                catch (UnauthorizedException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    if (retryCount >= maxRetries - 1)
                    {
                        throw;
                    }
                    retryCount++;
                    await Task.Delay(100 * retryCount);
                }
            }

            throw new UnauthorizedException("Không thể làm mới token. Vui lòng thử lại sau.");
        }

        public async Task<AuthResponseDto> LoginWithGoogleAsync(GoogleLoginRequestDto request)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
            var email = payload.Email;
            var fullName = payload.Name ?? email;

            var existingUser = await _userRepository.GetByEmailAsync(email);
            if (existingUser == null)
            {
                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = $"temp_{Guid.NewGuid().ToString("N")[..8]}", 
                    NormalizedUserName = $"TEMP_{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                    Email = email,
                    NormalizedEmail = email.ToUpperInvariant(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    FullName = fullName,
                    EmailConfirmed = true,
                    Status = 1,
                    IsProfileCompleted = false,
                    LockoutEnabled = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _userRepository.CreateAsync(newUser);
                await _userRoleRepository.AssignRole("Patient", newUser.Id);

                var newPatient = new Patient
                {
                    Id = Guid.NewGuid(),
                    UserId = newUser.Id,
                    MedicalRecordNumber = $"MR{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _patientRepository.SavePatientAsync(newPatient);

                var walletDto = new WalletDTo
                {
                    UserId = newUser.Id,
                    Balance = 0,
                    Currency = "VND",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                var createdWallet = await _walletService.CreateWalletAsync(walletDto);

                existingUser = newUser;
                existingUser.Role = "Patient";
            }
            else if (string.IsNullOrEmpty(existingUser.Role))
            {
                var roleEntity = await _userRoleRepository.GetByIdAsync(existingUser.Id);
                existingUser.Role = roleEntity?.RoleCode ?? "Patient";
            }

            if (existingUser.LockoutEnabled)
            {
                throw new UnauthorizedException("Tài khoản bị khóa, vui lòng liên hệ bộ phận hỗ trợ");
            }

            var accessToken = _jwtService.GenerateAccessToken(existingUser, new List<string> { existingUser.Role });
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refreshEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = existingUser.Id,
                Token = refreshToken,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshEntity);
            await _context.SaveChangesAsync();

            // Get actual token expiration time from configuration
            var expiryMinutes = await _configService.GetIntValueAsync("JWT_EXPIRY_MINUTES") ?? 30;
            var tokenExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

                return new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = tokenExpiresAt,
                    User = new UserDto
                    {
                        Id = existingUser.Id,
                        Email = existingUser.Email,
                        FullName = existingUser.FullName,
                        Role = existingUser.Role,
                        EmailConfirmed = true,
                        CreatedAt = existingUser.CreatedAt,
                        UserName = existingUser.UserName,
                        IsTemporaryUsername = existingUser.UserName.StartsWith("temp_")
                    }
                };
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            try
            {
                var user = await _userRepository.GetByEmailAsync(request.Email);
                if (user == null) 
                {
                    return true;
                }

                var code = new Random().Next(100000, 999999).ToString();

                var entity = new Medix.API.Models.Entities.EmailVerificationCode
                {
                    Email = request.Email,
                    Code = code,
                    ExpirationTime = DateTime.UtcNow.AddMinutes(15),
                    IsUsed = false
                };

                _context.EmailVerificationCodes.Add(entity);
                await _context.SaveChangesAsync();

                var emailSent = await _emailService.SendForgotPasswordCodeAsync(user.Email, code);
                
                if (!emailSent)
                {
                    Console.WriteLine($"Warning: Failed to send verification email to {user.Email}");
                }

                Console.WriteLine($"=== FORGOT PASSWORD CODE FOR {user.Email}: {code} ===");

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ForgotPasswordAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; 
            }
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            Console.WriteLine($"=== RESET PASSWORD FOR {request.Email} WITH CODE {request.Code} ===");

            /*
            // Validate code stored in DB
            var codeEntity = await _context.EmailVerificationCodes
                .Where(c => c.Email == request.Email && c.Code == request.Code && !c.IsUsed)
                .OrderByDescending(c => c.ExpirationTime)
                .FirstOrDefaultAsync();

            if (codeEntity == null || codeEntity.ExpirationTime < DateTime.UtcNow)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Code", new[] { "Mã xác nhận không hợp lệ hoặc đã hết hạn" } }
                });
            }
            */

            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null) 
            {
                Console.WriteLine($"User not found for email: {request.Email}");
                return true; 
            }

            await _configService.ValidatePasswordAsync(request.Password);

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            Console.WriteLine($"Password reset successfully for user: {user.Email}");

            /*
            // Mark code as used
            codeEntity.IsUsed = true;
            await _context.SaveChangesAsync();
            */

            return true;
        }

        public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new NotFoundException("User not found");

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                throw new ValidationException(
                    new Dictionary<string, string[]>
                    {
                { "CurrentPassword", new[] { "Mật khẩu hiện tại không đúng" } }
                    });
            }

            await _configService.ValidatePasswordAsync(request.NewPassword);

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<bool> LogoutAsync(Guid userId)
        {
            var tokens = _context.RefreshTokens.Where(r => r.UserId == userId);
            _context.RefreshTokens.RemoveRange(tokens);
            await _context.SaveChangesAsync();
            return true;
        }

        
    }
}
