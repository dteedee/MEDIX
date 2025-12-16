using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.Authen;
using Medix.API.Models.DTOs.Admin;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using Medix.API.Exceptions;
using AutoMapper;
using Medix.API.DataAccess.Interfaces.UserManagement;

namespace Medix.API.Tests.Services.UserManagement
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
            _mapperMock = new Mock<IMapper>();

            _userService = new UserService(
                _userRepositoryMock.Object,
                _patientRepositoryMock.Object,
                _userRoleRepositoryMock.Object,
                _mapperMock.Object
            );
        }

        [Fact]
        public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.Parse("00000000-0000-0000-0000-000000000000");
            _userRepositoryMock.Setup(x => x.GetByIdAsync(invalidId))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetByIdAsync(invalidId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_WithValidId_ShouldReturnUserDto()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                FullName = "Test User"
            };

            var userDto = new UserDto
            {
                Id = userId,
                Email = "test@gmail.com",
                FullName = "Test User"
            };

            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);
            _mapperMock.Setup(x => x.Map<UserDto>(user))
                .Returns(userDto);

            // Act
            var result = await _userService.GetByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
            result.Email.Should().Be("test@gmail.com");
        }

        [Fact]
        public async Task EmailExistsAsync_WithExistingEmail_ShouldReturnTrue()
        {
            // Arrange
            var email = "existing@gmail.com";
            var user = new User { Email = email };

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(email))
                .ReturnsAsync(user);

            // Act
            var result = await _userService.EmailExistsAsync(email);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task EmailExistsAsync_WithNonExistentEmail_ShouldReturnFalse()
        {
            // Arrange
            var email = "nonexistent@gmail.com";

            _userRepositoryMock.Setup(x => x.GetByEmailAsync(email))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.EmailExistsAsync(email);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllUsers()
        {
            // Arrange
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), Email = "user1@gmail.com" },
                new User { Id = Guid.NewGuid(), Email = "user2@gmail.com" }
            };
            _userRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(users);
            _mapperMock.Setup(x => x.Map<IEnumerable<UserDto>>(It.IsAny<IEnumerable<User>>()))
                .Returns(users.Select(u => new UserDto { Id = u.Id, Email = u.Email }));

            // Act
            var result = await _userService.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task UpdateAsync_WithValidId_ShouldUpdateUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var currentUserId = Guid.NewGuid();
            var existingUser = new User { Id = userId, Email = "old@gmail.com", FullName = "Old Name" };
            var updateDto = new UpdateUserDTO { FullName = "New Name", LockoutEnabled = false };
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<User>())).ReturnsAsync(existingUser);
            _userRoleRepositoryMock.Setup(x => x.GetRoleByDisplayNameAsync(It.IsAny<string>())).ReturnsAsync((RefRole?)null!);
            _mapperMock.Setup(x => x.Map<UserDto>(It.IsAny<User>()))
                .Returns(new UserDto { Id = userId, FullName = "New Name" });

            // Act
            var result = await _userService.UpdateAsync(userId, updateDto, currentUserId);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithInvalidId_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var currentUserId = Guid.NewGuid();
            var updateDto = new UpdateUserDTO { FullName = "New Name" };
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _userService.UpdateAsync(userId, updateDto, currentUserId));
        }

        [Fact]
        public async Task UpdateAsync_WithSelfLockout_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingUser = new User { Id = userId, LockoutEnabled = false };
            var updateDto = new UpdateUserDTO { LockoutEnabled = true };
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(existingUser);

            // Act & Assert
            await Assert.ThrowsAsync<MedixException>(() => _userService.UpdateAsync(userId, updateDto, userId));
        }

        [Fact]
        public async Task GetByEmailAsync_WithValidEmail_ShouldReturnUser()
        {
            // Arrange
            var email = "test@gmail.com";
            var user = new User { Id = Guid.NewGuid(), Email = email };
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(email)).ReturnsAsync(user);
            _mapperMock.Setup(x => x.Map<UserDto>(user))
                .Returns(new UserDto { Id = user.Id, Email = email });

            // Act
            var result = await _userService.GetByEmailAsync(email);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(email);
        }

        [Fact]
        public async Task GetByEmailAsync_WithInvalidEmail_ShouldReturnNull()
        {
            // Arrange
            var email = "nonexistent@gmail.com";
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(email)).ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetByEmailAsync(email);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsync_WithValidId_ShouldReturnTrue()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User { Id = userId };
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRepositoryMock.Setup(x => x.DeleteAsync(userId)).ReturnsAsync(true);

            // Act
            var result = await _userService.DeleteAsync(userId);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteAsync_WithInvalidId_ShouldReturnFalse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var result = await _userService.DeleteAsync(userId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task SearchAsync_WithQuery_ShouldReturnMatchingUsers()
        {
            // Arrange
            var keyword = "test";
            var page = 1;
            var pageSize = 10;
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), FullName = "Test User" }
            };
            _userRepositoryMock.Setup(x => x.SearchAsync(keyword, page, pageSize))
                .ReturnsAsync((1, users.AsEnumerable()));
            _mapperMock.Setup(x => x.Map<IEnumerable<UserDto>>(It.IsAny<IEnumerable<User>>()))
                .Returns(users.Select(u => new UserDto { Id = u.Id, FullName = u.FullName }));

            // Act
            var result = await _userService.SearchAsync(keyword, page, pageSize);

            // Assert
            result.Should().NotBeNull();
            result.total.Should().Be(1);
            result.data.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByIdAsync_WithEmptyGuid_ShouldReturnNull()
        {
            // Arrange
            var emptyId = Guid.Empty;
            _userRepositoryMock.Setup(x => x.GetByIdAsync(emptyId)).ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetByIdAsync(emptyId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task EmailExistsAsync_WithEmptyEmail_ShouldReturnFalse()
        {
            // Arrange
            var email = "";
            _userRepositoryMock.Setup(x => x.GetByEmailAsync(email)).ReturnsAsync((User?)null);

            // Act
            var result = await _userService.EmailExistsAsync(email);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _userRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<User>());
            _mapperMock.Setup(x => x.Map<IEnumerable<UserDto>>(It.IsAny<IEnumerable<User>>()))
                .Returns(new List<UserDto>());

            // Act
            var result = await _userService.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task SearchAsync_WithEmptyKeyword_ShouldReturnAll()
        {
            // Arrange
            var keyword = "";
            var page = 1;
            var pageSize = 10;
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), FullName = "Test User" }
            };
            _userRepositoryMock.Setup(x => x.SearchAsync(keyword, page, pageSize))
                .ReturnsAsync((1, users.AsEnumerable()));
            _mapperMock.Setup(x => x.Map<IEnumerable<UserDto>>(It.IsAny<IEnumerable<User>>()))
                .Returns(users.Select(u => new UserDto { Id = u.Id, FullName = u.FullName }));

            // Act
            var result = await _userService.SearchAsync(keyword, page, pageSize);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithNullDto_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var currentUserId = Guid.NewGuid();
            var user = new User { Id = userId };
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _userService.UpdateAsync(userId, null!, currentUserId));
        }

        [Fact]
        public async Task DeleteAsync_WithEmptyGuid_ShouldReturnFalse()
        {
            // Arrange
            var userId = Guid.Empty;
            _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var result = await _userService.DeleteAsync(userId);

            // Assert
            result.Should().BeFalse();
        }
    }
}

