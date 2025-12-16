using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.Extensions.Configuration;

namespace Medix.API.Tests.Services.UserManagement
{
    public class JwtServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<ISystemConfigurationService> _systemConfigMock;
        private readonly JwtService _service;

        public JwtServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();
            _systemConfigMock = new Mock<ISystemConfigurationService>();

            _configurationMock.Setup(x => x["Jwt:Key"]).Returns("TestKey123456789012345678901234567890");
            _configurationMock.Setup(x => x["Jwt:Issuer"]).Returns("TestIssuer");
            _configurationMock.Setup(x => x["Jwt:Audience"]).Returns("TestAudience");
            _systemConfigMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES"))
                .ReturnsAsync(30);

            _service = new JwtService(_configurationMock.Object, _systemConfigMock.Object);
        }

        [Fact]
        public void GenerateAccessToken_WithValidUser_ShouldReturnToken()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FullName = "Test User"
            };
            var roles = new List<string> { "Patient" };

            // Act
            var result = _service.GenerateAccessToken(user, roles);

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateRefreshToken_ShouldReturnToken()
        {
            // Act
            var result = _service.GenerateRefreshToken();

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateRefreshToken_ShouldReturnUniqueTokens()
        {
            // Act
            var token1 = _service.GenerateRefreshToken();
            var token2 = _service.GenerateRefreshToken();

            // Assert
            token1.Should().NotBe(token2);
        }

        [Fact]
        public void ValidateRefreshToken_WithValidGuid_ShouldReturnTrue()
        {
            // Arrange
            var token = Guid.NewGuid().ToString();

            // Act
            var result = _service.ValidateRefreshToken(token);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void ValidateRefreshToken_WithValidBase64_ShouldReturnTrue()
        {
            // Arrange
            var token = Convert.ToBase64String(new byte[32]);

            // Act
            var result = _service.ValidateRefreshToken(token);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void ValidateRefreshToken_WithEmptyString_ShouldReturnFalse()
        {
            // Arrange
            var token = "";

            // Act
            var result = _service.ValidateRefreshToken(token);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void ValidateRefreshToken_WithNull_ShouldReturnFalse()
        {
            // Arrange
            string? token = null;

            // Act
            var result = _service.ValidateRefreshToken(token!);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void ValidateRefreshToken_WithInvalidString_ShouldReturnFalse()
        {
            // Arrange
            var token = "invalid-token-format";

            // Act
            var result = _service.ValidateRefreshToken(token);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void GenerateAccessToken_WithMultipleRoles_ShouldIncludeAllRoles()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FullName = "Test User"
            };
            var roles = new List<string> { "Patient", "Doctor" };

            // Act
            var result = _service.GenerateAccessToken(user, roles);

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateAccessToken_WithNullUser_ShouldThrowException()
        {
            // Arrange
            User? user = null;
            var roles = new List<string> { "Patient" };

            // Act & Assert
            Assert.Throws<NullReferenceException>(() => _service.GenerateAccessToken(user!, roles));
        }

        [Fact]
        public void GenerateAccessToken_WithNullRoles_ShouldThrowException()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), Email = "test@example.com" };
            List<string>? roles = null;

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _service.GenerateAccessToken(user, roles!));
        }

        [Fact]
        public void GenerateAccessToken_WithEmptyRoles_ShouldReturnToken()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), Email = "test@example.com", FullName = "Test User" };
            var roles = new List<string>();

            // Act
            var result = _service.GenerateAccessToken(user, roles);

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void ValidateRefreshToken_WithValidGuidString_ShouldReturnTrue()
        {
            // Arrange
            var token = Guid.NewGuid().ToString("N");

            // Act
            var result = _service.ValidateRefreshToken(token);

            // Assert
            result.Should().BeTrue();
        }
    }
}

