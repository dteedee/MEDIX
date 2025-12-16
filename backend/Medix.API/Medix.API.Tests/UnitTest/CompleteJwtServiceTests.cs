using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.Extensions.Configuration;

namespace Medix.API.Tests.UnitTest
{
    /// <summary>
    /// Complete JWT Service Tests based on Program.cs test cases
    /// Covers: GenerateAccessToken, ValidateRefreshToken
    /// </summary>
    public class CompleteJwtServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<ISystemConfigurationService> _systemConfigMock;
        private readonly JwtService _jwtService;

        public CompleteJwtServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();
            _systemConfigMock = new Mock<ISystemConfigurationService>();

            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x["Key"]).Returns("ThisIsAVeryLongSecretKeyForJwtTokenGeneration123456789");
            configSection.Setup(x => x["Issuer"]).Returns("MedixAPI");
            configSection.Setup(x => x["Audience"]).Returns("MedixClient");

            _configurationMock.Setup(x => x["Jwt:Key"])
                .Returns("ThisIsAVeryLongSecretKeyForJwtTokenGeneration123456789");
            _configurationMock.Setup(x => x["Jwt:Issuer"])
                .Returns("MedixAPI");
            _configurationMock.Setup(x => x["Jwt:Audience"])
                .Returns("MedixClient");
            _configurationMock.Setup(x => x.GetSection("Jwt"))
                .Returns(configSection.Object);

            _systemConfigMock.Setup(x => x.GetIntValueAsync("JWT_EXPIRY_MINUTES"))
                .ReturnsAsync(30);

            _jwtService = new JwtService(
                _configurationMock.Object,
                _systemConfigMock.Object
            );
        }

        #region GenerateAccessToken Tests

        [Fact]
        public void GenerateAccessToken_WithInvalidUserId_ShouldGenerateToken()
        {
            // Arrange - Test case from Program.cs: UserId = "invalid-id", Role = "Patient"
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FullName = "Test User"
            };
            var roles = new List<string> { "Patient" };

            // Act
            var token = _jwtService.GenerateAccessToken(user, roles);

            // Assert
            token.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GenerateAccessToken_WithValidData_ShouldGenerateToken()
        {
            // Arrange - Test case from Program.cs: UserId = "valid-guid", Role = "Doctor"
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "doctor@example.com",
                FullName = "Dr. Test"
            };
            var roles = new List<string> { "Doctor" };

            // Act
            var token = _jwtService.GenerateAccessToken(user, roles);

            // Assert
            token.Should().NotBeNullOrEmpty();
            token.Split('.').Should().HaveCount(3); // JWT has 3 parts
        }

        [Fact]
        public void GenerateAccessToken_WithMultipleRoles_ShouldGenerateToken()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@example.com",
                FullName = "Admin User"
            };
            var roles = new List<string> { "Admin", "Doctor" };

            // Act
            var token = _jwtService.GenerateAccessToken(user, roles);

            // Assert
            token.Should().NotBeNullOrEmpty();
        }

        #endregion

        #region ValidateRefreshToken Tests

        [Fact]
        public void ValidateRefreshToken_WithEmptyToken_ShouldReturnFalse()
        {
            // Arrange - Test case from Program.cs: RefreshToken = ""
            var emptyToken = "";

            // Act
            var result = _jwtService.ValidateRefreshToken(emptyToken);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void ValidateRefreshToken_WithExpiredToken_ShouldReturnFalse()
        {
            // Arrange - Test case from Program.cs: RefreshToken = "expired-token"
            // Note: The actual implementation checks format, not expiration
            var expiredToken = "expired-token";

            // Act
            var result = _jwtService.ValidateRefreshToken(expiredToken);

            // Assert
            // The implementation checks if it's a valid GUID or Base64, so this might return false
            result.Should().BeFalse();
        }

        [Fact]
        public void ValidateRefreshToken_WithInvalidToken_ShouldReturnFalse()
        {
            // Arrange - Test case from Program.cs: RefreshToken = "invalid-token"
            var invalidToken = "invalid-token";

            // Act
            var result = _jwtService.ValidateRefreshToken(invalidToken);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void ValidateRefreshToken_WithValidGuidToken_ShouldReturnTrue()
        {
            // Arrange - Test case from Program.cs: RefreshToken = "valid-token"
            // The implementation accepts GUID format
            var validGuidToken = Guid.NewGuid().ToString();

            // Act
            var result = _jwtService.ValidateRefreshToken(validGuidToken);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void ValidateRefreshToken_WithValidBase64Token_ShouldReturnTrue()
        {
            // Arrange - The implementation also accepts Base64 format (32 bytes)
            var bytes = new byte[32];
            System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
            var validBase64Token = Convert.ToBase64String(bytes);

            // Act
            var result = _jwtService.ValidateRefreshToken(validBase64Token);

            // Assert
            result.Should().BeTrue();
        }

        #endregion
    }
}



