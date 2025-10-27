using System.Net;
using System.Text.Json;
using FluentAssertions;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Medix.API.Tests.Integration.Controllers
{
    public class AuthControllerIntegrationTests : BaseIntegrationTest
    {
        public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory) : base(factory)
        {
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnSuccess()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = false,
                LockoutEnd = null,
                AccessFailedCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Context.Users.Add(user);
            await Context.SaveChangesAsync();

            var loginRequest = new LoginRequestDto
            {
                Identifier = "test@example.com",
                Password = "password123"
            };

            // Act
            var response = await PostAsync("/api/auth/login", loginRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<AuthResponseDto>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data!.User.Email.Should().Be("test@example.com");
            result.Data.User.FullName.Should().Be("Test User");
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequestDto
            {
                Identifier = "nonexistent@example.com",
                Password = "wrongpassword"
            };

            // Act
            var response = await PostAsync("/api/auth/login", loginRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Register_WithValidData_ShouldReturnSuccess()
        {
            // Arrange
            var registerRequest = new RegisterRequestDto
            {
                Email = "newuser@example.com",
                Password = "Password123!",
                FirstName = "New",
                LastName = "User"
            };

            // Act
            var response = await PostAsync("/api/auth/register", registerRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<AuthResponseDto>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data!.User.Email.Should().Be("newuser@example.com");
            result.Data.User.FullName.Should().Be("New User");
            result.Data.User.Role.Should().Be("Patient");

            // Verify user was created in database
            var createdUser = await Context.Users.FirstOrDefaultAsync(u => u.Email == "newuser@example.com");
            createdUser.Should().NotBeNull();
            createdUser!.FullName.Should().Be("New User");
        }

        [Fact]
        public async Task Register_WithExistingEmail_ShouldReturnBadRequest()
        {
            // Arrange
            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                UserName = "existing@example.com",
                FullName = "Existing User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Context.Users.Add(existingUser);
            await Context.SaveChangesAsync();

            var registerRequest = new RegisterRequestDto
            {
                Email = "existing@example.com",
                Password = "Password123!",
                FirstName = "New",
                LastName = "User"
            };

            // Act
            var response = await PostAsync("/api/auth/register", registerRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task RefreshToken_WithValidToken_ShouldReturnNewTokens()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                LockoutEnabled = false,
                LockoutEnd = null,
                AccessFailedCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Context.Users.Add(user);
            await Context.SaveChangesAsync();

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = "valid-refresh-token",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            Context.RefreshTokens.Add(refreshToken);
            await Context.SaveChangesAsync();

            var refreshTokenRequest = new RefreshTokenRequestDto
            {
                RefreshToken = "valid-refresh-token"
            };

            // Act
            var response = await PostAsync("/api/auth/refresh-token", refreshTokenRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<AuthResponseDto>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.Data.Should().NotBeNull();
            result.Data!.AccessToken.Should().NotBeNullOrEmpty();
            result.Data.RefreshToken.Should().NotBeNullOrEmpty();
            result.Data.RefreshToken.Should().NotBe("valid-refresh-token"); // Should be a new token
        }

        [Fact]
        public async Task RefreshToken_WithInvalidToken_ShouldReturnUnauthorized()
        {
            // Arrange
            var refreshTokenRequest = new RefreshTokenRequestDto
            {
                RefreshToken = "invalid-refresh-token"
            };

            // Act
            var response = await PostAsync("/api/auth/refresh-token", refreshTokenRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task ForgotPassword_WithValidEmail_ShouldReturnSuccess()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Context.Users.Add(user);
            await Context.SaveChangesAsync();

            var forgotPasswordRequest = new ForgotPasswordRequestDto
            {
                Email = "test@example.com"
            };

            // Act
            var response = await PostAsync("/api/auth/forgot-password", forgotPasswordRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<bool>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.Data.Should().BeTrue();
        }

        [Fact]
        public async Task ResetPassword_WithValidData_ShouldReturnSuccess()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpassword"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Context.Users.Add(user);
            await Context.SaveChangesAsync();

            var resetPasswordRequest = new ResetPasswordRequestDto
            {
                Email = "test@example.com",
                Code = "123456",
                Password = "NewPassword123!"
            };

            // Act
            var response = await PostAsync("/api/auth/reset-password", resetPasswordRequest);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<bool>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.Data.Should().BeTrue();

            // Verify password was updated
            var updatedUser = await Context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
            updatedUser.Should().NotBeNull();
            BCrypt.Net.BCrypt.Verify("NewPassword123!", updatedUser!.PasswordHash).Should().BeTrue();
        }
    }

    // Helper classes for API responses
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
    }
}

