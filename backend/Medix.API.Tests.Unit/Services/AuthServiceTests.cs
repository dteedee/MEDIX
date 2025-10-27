using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.UserManagement;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;
using Moq;
using FluentAssertions;
using Xunit;

namespace Medix.API.Tests.Unit.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IJwtService> _jwtServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<MedixContext> _contextMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _jwtServiceMock = new Mock<IJwtService>();
            _emailServiceMock = new Mock<IEmailService>();
            _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _contextMock = new Mock<MedixContext>(new DbContextOptions<MedixContext>());
            
            _authService = new AuthService(
                _userRepositoryMock.Object,
                _jwtServiceMock.Object,
                _emailServiceMock.Object,
                _userRoleRepositoryMock.Object,
                _patientRepositoryMock.Object,
                _contextMock.Object);
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "test@example.com",
                Password = "password123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = false,
                LockoutEnd = null,
                AccessFailedCount = 0
            };

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleCode = "Patient"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
                .ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(x => x.GetByIdAsync(user.Id))
                .ReturnsAsync(userRole);
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(user, It.IsAny<List<string>>()))
                .Returns("mock-access-token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("mock-refresh-token");

            // Mock DbSet for RefreshTokens
            var refreshTokens = new List<RefreshToken>();
            var mockSet = new Mock<DbSet<RefreshToken>>();
            mockSet.Setup(x => x.Add(It.IsAny<RefreshToken>())).Callback<RefreshToken>(x => refreshTokens.Add(x));
            _contextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);
            _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _authService.LoginAsync(loginRequest);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock-access-token");
            result.RefreshToken.Should().Be("mock-refresh-token");
            result.User.Email.Should().Be("test@example.com");
            result.User.FullName.Should().Be("Test User");
            result.User.Role.Should().Be("Patient");
        }

        [Fact]
        public async Task LoginAsync_WithInvalidEmail_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "nonexistent@example.com",
                Password = "password123"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
                .ReturnsAsync((User?)null);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "test@example.com",
                Password = "wrongpassword"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = false,
                LockoutEnd = null,
                AccessFailedCount = 0
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
                .ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
        }

        [Fact]
        public async Task LoginAsync_WithLockedAccount_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "test@example.com",
                Password = "password123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = true,
                LockoutEnd = null,
                AccessFailedCount = 0
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
                .ReturnsAsync(user);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
            exception.Message.Should().Contain("Tài khoản bị khóa vĩnh viễn");
        }

        [Fact]
        public async Task LoginAsync_WithTemporaryLockout_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "test@example.com",
                Password = "password123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = false,
                LockoutEnd = DateTime.UtcNow.AddMinutes(5),
                AccessFailedCount = 0
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
                .ReturnsAsync(user);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.LoginAsync(loginRequest));
            exception.Message.Should().Contain("Tài khoản của bạn đã bị khóa trong");
        }

        [Fact]
        public async Task RegisterAsync_WithValidData_ShouldReturnAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@example.com",
                Password = "password123",
                FirstName = "New",
                LastName = "User"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(registerRequest.Email))
                .ReturnsAsync((User?)null);
            _userRoleRepositoryMock.Setup(x => x.AssignRole("Patient", It.IsAny<Guid>()))
                .Returns(Task.CompletedTask);
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>()))
                .Returns("mock-access-token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("mock-refresh-token");

            // Mock DbSet for RefreshTokens
            var refreshTokens = new List<RefreshToken>();
            var mockSet = new Mock<DbSet<RefreshToken>>();
            mockSet.Setup(x => x.Add(It.IsAny<RefreshToken>())).Callback<RefreshToken>(x => refreshTokens.Add(x));
            _contextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);
            _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock-access-token");
            result.RefreshToken.Should().Be("mock-refresh-token");
            result.User.Email.Should().Be("newuser@example.com");
            result.User.FullName.Should().Be("New User");
            result.User.Role.Should().Be("Patient");
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldThrowValidationException()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "existing@example.com",
                Password = "password123",
                FirstName = "Existing",
                LastName = "User"
            };

            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                UserName = "existing@example.com",
                FullName = "Existing User"
            };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(registerRequest.Email))
                .ReturnsAsync(existingUser);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(registerRequest));
            exception.Errors.Should().ContainKey("Email");
            exception.Errors["Email"].Should().Contain("Email đã được sử dụng");
        }

        [Fact]
        public async Task RefreshTokenAsync_WithValidToken_ShouldReturnNewAuthResponse()
        {
            // Arrange
            var refreshTokenRequest = new RefreshTokenRequestDto
            {
                RefreshToken = "valid-refresh-token"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User"
            };

            var storedToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = "valid-refresh-token",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                User = user
            };

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleCode = "Patient"
            };

            // Mock DbSet for RefreshTokens
            var refreshTokens = new List<RefreshToken> { storedToken };
            var mockSet = new Mock<DbSet<RefreshToken>>();
            mockSet.Setup(x => x.Include(It.IsAny<string>())).Returns(mockSet.Object);
            mockSet.Setup(x => x.FirstOrDefaultAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(storedToken);
            mockSet.Setup(x => x.Remove(It.IsAny<RefreshToken>())).Callback<RefreshToken>(x => refreshTokens.Remove(x));
            mockSet.Setup(x => x.Add(It.IsAny<RefreshToken>())).Callback<RefreshToken>(x => refreshTokens.Add(x));
            _contextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);
            _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _userRoleRepositoryMock.Setup(x => x.GetByIdAsync(user.Id))
                .ReturnsAsync(userRole);
            _jwtServiceMock.Setup(x => x.GenerateAccessToken(user, It.IsAny<List<string>>()))
                .Returns("new-access-token");
            _jwtServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("new-refresh-token");

            // Act
            var result = await _authService.RefreshTokenAsync(refreshTokenRequest);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("new-access-token");
            result.RefreshToken.Should().Be("new-refresh-token");
            result.User.Email.Should().Be("test@example.com");
        }

        [Fact]
        public async Task RefreshTokenAsync_WithInvalidToken_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var refreshTokenRequest = new RefreshTokenRequestDto
            {
                RefreshToken = "invalid-refresh-token"
            };

            // Mock DbSet for RefreshTokens
            var mockSet = new Mock<DbSet<RefreshToken>>();
            mockSet.Setup(x => x.Include(It.IsAny<string>())).Returns(mockSet.Object);
            mockSet.Setup(x => x.FirstOrDefaultAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((RefreshToken?)null);
            _contextMock.Setup(x => x.RefreshTokens).Returns(mockSet.Object);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedException>(() => _authService.RefreshTokenAsync(refreshTokenRequest));
        }

        [Fact]
        public async Task ChangePasswordAsync_WithValidCurrentPassword_ShouldUpdatePassword()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var changePasswordRequest = new ChangePasswordRequestDto
            {
                CurrentPassword = "oldpassword",
                NewPassword = "newpassword123"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpassword")
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, changePasswordRequest);

            // Assert
            result.Should().BeTrue();
            _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task ChangePasswordAsync_WithInvalidCurrentPassword_ShouldThrowValidationException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var changePasswordRequest = new ChangePasswordRequestDto
            {
                CurrentPassword = "wrongpassword",
                NewPassword = "newpassword123"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpassword")
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ValidationException>(() => _authService.ChangePasswordAsync(userId, changePasswordRequest));
            exception.Errors.Should().ContainKey("CurrentPassword");
            exception.Errors["CurrentPassword"].Should().Contain("Mật khẩu hiện tại không đúng");
        }
    }
}
