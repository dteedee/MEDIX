using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs.Authen;
using Medix.API.Models.Entities;
using Medix.API.Exceptions;
using Medix.API.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Tests.Services.UserManagement
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IJwtService> _jwtServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<ISystemConfigurationService> _configServiceMock;
        private readonly Mock<IPromotionService> _promotionServiceMock;
        private readonly Mock<IUserPromotionService> _userPromotionServiceMock;
        private readonly Mock<IWalletService> _walletServiceMock;
        private readonly MedixContext _context;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _jwtServiceMock = new Mock<IJwtService>();
            _emailServiceMock = new Mock<IEmailService>();
            _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _configServiceMock = new Mock<ISystemConfigurationService>();
            _promotionServiceMock = new Mock<IPromotionService>();
            _userPromotionServiceMock = new Mock<IUserPromotionService>();
            _walletServiceMock = new Mock<IWalletService>();

            var options = new DbContextOptionsBuilder<MedixContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var userContext = new UserContext();
            _context = new MedixContext(options, userContext);

            _authService = new AuthService(
                _userRepositoryMock.Object,
                _jwtServiceMock.Object,
                _emailServiceMock.Object,
                _userRoleRepositoryMock.Object,
                _patientRepositoryMock.Object,
                _context,
                _walletServiceMock.Object,
                _configServiceMock.Object,
                _promotionServiceMock.Object,
                _userPromotionServiceMock.Object
            );
        }

        [Fact]
        public async Task LoginAsync_WithEmptyEmailAndPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "",
                Password = ""
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => 
                _authService.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_WithNonExistentUser_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "quang@gmail.com",
                Password = "123456789a"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedException>(() => 
                _authService.LoginAsync(loginRequest));
            
            exception.Message.Should().Contain("Tên đăng nhập/Email hoặc mật khẩu không đúng");
        }

        [Fact]
        public async Task LoginAsync_WithLockedAccount_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "huy@gmail.com",
                Password = "123456789a"
            };

            var lockedUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "huy@gmail.com",
                UserName = "huy@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789a"),
                LockoutEnabled = true,
                AccessFailedCount = 0
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(lockedUser);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedException>(() => 
                _authService.LoginAsync(loginRequest));
            
            exception.Message.Should().Contain("Tài khoản bị khóa");
        }

        [Fact]
        public async Task LoginAsync_WithWrongPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "quang@gmail.com",
                Password = "wrongpass"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "quang@gmail.com",
                UserName = "quang@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456789a"),
                LockoutEnabled = false,
                AccessFailedCount = 0
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(user);
            _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .ReturnsAsync(user);
            _configServiceMock.Setup(x => x.GetIntValueAsync("MaxFailedLoginAttempts"))
                .ReturnsAsync(5);
            _configServiceMock.Setup(x => x.GetIntValueAsync("AccountLockoutDurationMinutes"))
                .ReturnsAsync(15);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedException>(() => 
                _authService.LoginAsync(loginRequest));
            
            exception.Message.Should().Contain("Tên đăng nhập/Email hoặc mật khẩu không đúng");
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "long@gmail.com",
                Password = "12345678"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "long@gmail.com",
                UserName = "long@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678"),
                LockoutEnabled = false,
                AccessFailedCount = 0,
                FullName = "Long User",
                CreatedAt = DateTime.UtcNow,
                IsProfileCompleted = true
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(user);
            _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((UserRole?)null);
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>()))
                .Returns("access-token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("refresh-token");
            _configServiceMock.Setup(x => x.GetIntValueAsync("MaxFailedLoginAttempts"))
                .ReturnsAsync(5);
            _configServiceMock.Setup(x => x.GetIntValueAsync("AccountLockoutDurationMinutes"))
                .ReturnsAsync(15);
            _configServiceMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES"))
                .ReturnsAsync(30);

            // Act
            var result = await _authService.LoginAsync(loginRequest);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("access-token");
            result.RefreshToken.Should().Be("refresh-token");
            result.User.Should().NotBeNull();
            result.User.Email.Should().Be("long@gmail.com");
        }

        [Fact]
        public async Task RegisterAsync_WithValidData_ShouldReturnAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@gmail.com",
                Password = "123456789a",
                FirstName = "Nguyen",
                LastName = "Van A"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(x => x.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => u);
            _userRoleRepositoryMock.Setup(x => x.AssignRole(It.IsAny<string>(), It.IsAny<Guid>()))
                .ReturnsAsync("Patient");
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>()))
                .Returns("access-token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("refresh-token");
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);
            _configServiceMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES"))
                .ReturnsAsync(30);

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("access-token");
            result.RefreshToken.Should().Be("refresh-token");
            result.User.Should().NotBeNull();
            result.User.Email.Should().Be("newuser@gmail.com");
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldThrowValidationException()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "existing@gmail.com",
                Password = "123456789a",
                FirstName = "Nguyen",
                LastName = "Van A"
            };

            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@gmail.com"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(existingUser);
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ValidationException>(() => 
                _authService.RegisterAsync(registerRequest));
            
            exception.Errors.Should().ContainKey("Email");
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldResetFailedAttempts()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "user@gmail.com",
                Password = "correctpassword"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "user@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"),
                LockoutEnabled = false,
                AccessFailedCount = 3
            };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
            _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>())).ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((UserRole?)null);
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>())).Returns("token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh");
            _configServiceMock.Setup(x => x.GetIntValueAsync("MaxFailedLoginAttempts")).ReturnsAsync(5);
            _configServiceMock.Setup(x => x.GetIntValueAsync("AccountLockoutDurationMinutes")).ReturnsAsync(15);
            _configServiceMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES")).ReturnsAsync(30);

            // Act
            await _authService.LoginAsync(loginRequest);

            // Assert
            _userRepositoryMock.Verify(x => x.UpdateAsync(It.Is<User>(u => u.AccessFailedCount == 0)), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithMaxFailedAttempts_ShouldLockAccount()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "user@gmail.com",
                Password = "wrongpassword"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "user@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"),
                LockoutEnabled = false,
                AccessFailedCount = 4
            };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
            _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>())).ReturnsAsync(user);
            _configServiceMock.Setup(x => x.GetIntValueAsync("MaxFailedLoginAttempts")).ReturnsAsync(5);
            _configServiceMock.Setup(x => x.GetIntValueAsync("AccountLockoutDurationMinutes")).ReturnsAsync(15);

            // Act
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));

            // Assert
            _userRepositoryMock.Verify(x => x.UpdateAsync(It.Is<User>(u => u.LockoutEnd != null)), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithInvalidPassword_ShouldThrowException()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@gmail.com",
                Password = "weak",
                FirstName = "Nguyen",
                LastName = "Van A"
            };
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>()))
                .ThrowsAsync(new ValidationException(new Dictionary<string, string[]> { { "Password", new[] { "Password does not meet requirements" } } }));

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(registerRequest));
        }

        [Fact]
        public async Task RegisterAsync_ShouldCreateUserWithHashedPassword()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@gmail.com",
                Password = "ValidPassword123!",
                FirstName = "Nguyen",
                LastName = "Van A"
            };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(x => x.CreateAsync(It.IsAny<User>())).ReturnsAsync((User u) => u);
            _userRoleRepositoryMock.Setup(x => x.AssignRole(It.IsAny<string>(), It.IsAny<Guid>())).ReturnsAsync("Patient");
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>())).Returns("token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh");
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
            _configServiceMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES")).ReturnsAsync(30);

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            _userRepositoryMock.Verify(x => x.CreateAsync(It.Is<User>(u => 
                !string.IsNullOrEmpty(u.PasswordHash) && u.PasswordHash != registerRequest.Password)), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_ShouldSetFullNameFromFirstAndLastName()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@gmail.com",
                Password = "ValidPassword123!",
                FirstName = "Nguyen",
                LastName = "Van A"
            };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(x => x.CreateAsync(It.IsAny<User>())).ReturnsAsync((User u) => u);
            _userRoleRepositoryMock.Setup(x => x.AssignRole(It.IsAny<string>(), It.IsAny<Guid>())).ReturnsAsync("Patient");
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>())).Returns("token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("refresh");
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
            _configServiceMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES")).ReturnsAsync(30);

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            _userRepositoryMock.Verify(x => x.CreateAsync(It.Is<User>(u => 
                u.FullName == $"{registerRequest.FirstName} {registerRequest.LastName}")), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithNullRequest_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _authService.LoginAsync(null!));
        }

        [Fact]
        public async Task RegisterAsync_WithNullRequest_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _authService.RegisterAsync(null!));
        }

        [Fact]
        public async Task LoginAsync_WithNullPassword_ShouldThrowException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto { Identifier = "test@example.com", Password = null! };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_WithNullIdentifier_ShouldThrowException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto { Identifier = null!, Password = "password" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task RegisterAsync_WithNullEmail_ShouldThrowException()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = null!,
                Password = "ValidPassword123!",
                FirstName = "Test",
                LastName = "User"
            };
            _configServiceMock.Setup(x => x.ValidatePasswordAsync(It.IsAny<string>()))
                .ThrowsAsync(new ValidationException(new Dictionary<string, string[]>()));

            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(registerRequest));
        }

        [Fact]
        public async Task LoginAsync_WithExpiredLockout_ShouldThrowException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "user@gmail.com",
                Password = "correctpassword"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "user@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"),
                LockoutEnabled = true,
                LockoutEnd = DateTime.UtcNow.AddMinutes(-1),
                AccessFailedCount = 0
            };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
        }
    }
}

