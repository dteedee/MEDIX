using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Models.DTOs;
using Medix.API.Presentation.Controller.UserManagement;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using Xunit;
using System.Security.Claims;

namespace Medix.API.Tests.Unit.Controllers
{
    public class UserControllerTests
    {
        private readonly Mock<IUserService> _userServiceMock;
        private readonly Mock<ILogger<UserController>> _loggerMock;
        private readonly Mock<IPatientService> _patientServiceMock;
        private readonly UserController _controller;

        public UserControllerTests()
        {
            _userServiceMock = new Mock<IUserService>();
            _loggerMock = new Mock<ILogger<UserController>>();
            _patientServiceMock = new Mock<IPatientService>();
            
            _controller = new UserController(_loggerMock.Object, _userServiceMock.Object, _patientServiceMock.Object);
        }

        [Fact]
        public async Task GetUserInfor_WithValidToken_ShouldReturnUserInfo()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var userInfo = new UserDto
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                Role = "Patient"
            };

            _userServiceMock.Setup(x => x.GetUserBasicInfo(userId))
                .ReturnsAsync(userInfo);

            // Act
            var result = await _controller.GetUserInfor();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(userInfo);
        }

        [Fact]
        public async Task GetUserInfor_WithInvalidToken_ShouldReturnUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal()
                }
            };

            // Act
            var result = await _controller.GetUserInfor();

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
            var unauthorizedResult = result as UnauthorizedObjectResult;
            unauthorizedResult!.Value.Should().BeEquivalentTo(new { message = "User ID not found in token" });
        }

        [Fact]
        public async Task GetUserInfor_WithNonExistentUser_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _userServiceMock.Setup(x => x.GetUserBasicInfo(userId))
                .ReturnsAsync((UserDto?)null);

            // Act
            var result = await _controller.GetUserInfor();

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
            var notFoundResult = result as NotFoundObjectResult;
            notFoundResult!.Value.Should().BeEquivalentTo(new { message = "User not found" });
        }

        [Fact]
        public async Task UpdateUserInfor_WithValidData_ShouldReturnUpdatedUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var updateDto = new UpdateUserDto
            {
                FullName = "Updated Name",
                PhoneNumber = "0123456789"
            };

            var updatedUser = new UserDto
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Updated Name",
                PhoneNumber = "0123456789"
            };

            _userServiceMock.Setup(x => x.UpdateUserBasicInfo(It.IsAny<UpdateUserDto>()))
                .ReturnsAsync(updatedUser);

            // Act
            var result = await _controller.UpdateUserInfor(updateDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(updatedUser);
            
            _userServiceMock.Verify(x => x.UpdateUserBasicInfo(It.Is<UpdateUserDto>(d => d.Id == userId)), Times.Once);
        }

        [Fact]
        public async Task UpdateUserInfor_WithPatientData_ShouldUpdatePatientInfo()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var updateDto = new UpdateUserDto
            {
                FullName = "Updated Name",
                EmergencyContactName = "Emergency Contact",
                EmergencyContactPhone = "0987654321",
                Allergies = "None",
                MedicalHistory = "None"
            };

            var updatedUser = new UserDto
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Updated Name"
            };

            var patient = new PatientDto
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EmergencyContactName = "Emergency Contact",
                EmergencyContactPhone = "0987654321",
                Allergies = "None",
                MedicalHistory = "None"
            };

            _userServiceMock.Setup(x => x.UpdateUserBasicInfo(It.IsAny<UpdateUserDto>()))
                .ReturnsAsync(updatedUser);
            _patientServiceMock.Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(patient);
            _patientServiceMock.Setup(x => x.UpdateAsync(userId, It.IsAny<PatientDto>()))
                .ReturnsAsync(patient);

            // Act
            var result = await _controller.UpdateUserInfor(updateDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(updatedUser);
            
            _patientServiceMock.Verify(x => x.GetByUserIdAsync(userId), Times.Once);
            _patientServiceMock.Verify(x => x.UpdateAsync(userId, It.IsAny<PatientDto>()), Times.Once);
        }

        [Fact]
        public async Task GetPaged_ShouldReturnPagedUsers()
        {
            // Arrange
            var page = 1;
            var pageSize = 10;
            var totalCount = 25;
            var users = new List<UserDto>
            {
                new UserDto { Id = Guid.NewGuid(), Email = "user1@example.com", FullName = "User 1" },
                new UserDto { Id = Guid.NewGuid(), Email = "user2@example.com", FullName = "User 2" }
            };
            var pagedResult = new Tuple<int, IEnumerable<UserDto>>(totalCount, users);

            _userServiceMock.Setup(x => x.GetPagedAsync(page, pageSize))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _controller.GetPaged(page, pageSize);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(pagedResult);
        }

        [Fact]
        public async Task GetById_WithValidId_ShouldReturnUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new UserDto
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User"
            };

            _userServiceMock.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var result = await _controller.GetById(userId);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(user);
        }

        [Fact]
        public async Task GetById_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _userServiceMock.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync((UserDto?)null);

            // Act
            var result = await _controller.GetById(userId);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task CreateUser_WithValidData_ShouldReturnCreatedUser()
        {
            // Arrange
            var createUserDto = new CreateUserDTO
            {
                Email = "newuser@example.com",
                FullName = "New User",
                Password = "Password123!"
            };

            var createdUser = new UserDto
            {
                Id = Guid.NewGuid(),
                Email = "newuser@example.com",
                FullName = "New User"
            };

            _userServiceMock.Setup(x => x.CreateUserAsync(createUserDto))
                .ReturnsAsync(createdUser);

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            var createdResult = result as CreatedAtActionResult;
            createdResult!.Value.Should().BeEquivalentTo(createdUser);
        }

        [Fact]
        public async Task CreateUser_WithInvalidData_ShouldReturnBadRequest()
        {
            // Arrange
            var createUserDto = new CreateUserDTO(); // Invalid data
            _controller.ModelState.AddModelError("Email", "Email is required");

            // Act
            var result = await _controller.CreateUser(createUserDto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task UpdateUser_WithValidData_ShouldReturnUpdatedUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var updateUserDto = new UpdateUserDTO
            {
                FullName = "Updated Name"
            };

            var updatedUser = new UserDto
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Updated Name"
            };

            _userServiceMock.Setup(x => x.UpdateAsync(userId, updateUserDto))
                .ReturnsAsync(updatedUser);

            // Act
            var result = await _controller.UpdateUser(userId, updateUserDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(updatedUser);
        }

        [Fact]
        public async Task DeleteUser_ShouldReturnNoContent()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _userServiceMock.Setup(x => x.DeleteAsync(userId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _userServiceMock.Verify(x => x.DeleteAsync(userId), Times.Once);
        }

        [Fact]
        public async Task SearchUsers_WithKeyword_ShouldReturnSearchResults()
        {
            // Arrange
            var keyword = "test";
            var page = 1;
            var pageSize = 10;
            var totalCount = 5;
            var users = new List<UserDto>
            {
                new UserDto { Id = Guid.NewGuid(), Email = "test@example.com", FullName = "Test User" }
            };
            var searchResult = new Tuple<int, IEnumerable<UserDto>>(totalCount, users);

            _userServiceMock.Setup(x => x.SearchAsync(keyword, page, pageSize))
                .ReturnsAsync(searchResult);

            // Act
            var result = await _controller.SearchUsers(keyword, page, pageSize);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(searchResult);
        }

        [Fact]
        public async Task SearchUsers_WithEmptyKeyword_ShouldReturnPagedUsers()
        {
            // Arrange
            var keyword = "";
            var page = 1;
            var pageSize = 10;
            var totalCount = 25;
            var users = new List<UserDto>();
            var pagedResult = new Tuple<int, IEnumerable<UserDto>>(totalCount, users);

            _userServiceMock.Setup(x => x.GetPagedAsync(page, pageSize))
                .ReturnsAsync(pagedResult);

            // Act
            var result = await _controller.SearchUsers(keyword, page, pageSize);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeEquivalentTo(pagedResult);
        }
    }
}

