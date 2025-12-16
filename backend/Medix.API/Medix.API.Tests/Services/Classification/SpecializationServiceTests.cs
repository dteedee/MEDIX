using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Tests.Services.Classification
{
    public class SpecializationServiceTests
    {
        private readonly Mock<ISpecializationRepository> _repositoryMock;
        private readonly SpecializationService _service;

        public SpecializationServiceTests()
        {
            _repositoryMock = new Mock<ISpecializationRepository>();
            _service = new SpecializationService(_repositoryMock.Object);
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllSpecializations()
        {
            // Arrange
            var specializations = new List<Specialization>
            {
                new Specialization { Id = Guid.NewGuid(), Name = "Cardiology" }
            };
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(specializations);

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetActiveAsync_ShouldReturnActiveSpecializations()
        {
            // Arrange
            var specializations = new List<Specialization>
            {
                new Specialization { Id = Guid.NewGuid(), IsActive = true }
            };
            _repositoryMock.Setup(x => x.GetActiveAsync()).ReturnsAsync(specializations);

            // Act
            var result = await _service.GetActiveAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByIdAsync_WithValidId_ShouldReturnSpecialization()
        {
            // Arrange
            var specializationId = Guid.NewGuid();
            var specialization = new Specialization { Id = specializationId, Name = "Cardiology" };
            _repositoryMock.Setup(x => x.GetByIdAsync(specializationId)).ReturnsAsync(specialization);

            // Act
            var result = await _service.GetByIdAsync(specializationId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(specializationId);
        }

        [Fact]
        public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var specializationId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByIdAsync(specializationId)).ReturnsAsync((Specialization?)null);

            // Act
            var result = await _service.GetByIdAsync(specializationId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByCodeAsync_WithValidCode_ShouldReturnSpecialization()
        {
            // Arrange
            var code = "CARD";
            var specialization = new Specialization { Id = Guid.NewGuid(), Code = code };
            _repositoryMock.Setup(x => x.GetByCodeAsync(code)).ReturnsAsync(specialization);

            // Act
            var result = await _service.GetByCodeAsync(code);

            // Assert
            result.Should().NotBeNull();
            result!.Code.Should().Be(code);
        }

        [Fact]
        public async Task CreateAsync_WithValidData_ShouldCreateSpecialization()
        {
            // Arrange
            var specialization = new Specialization { Id = Guid.NewGuid(), Name = "New Specialization" };
            _repositoryMock.Setup(x => x.CreateAsync(It.IsAny<Specialization>())).ReturnsAsync(specialization);

            // Act
            var result = await _service.CreateAsync(specialization);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(specialization.Name);
        }

        [Fact]
        public async Task UpdateAsync_WithValidData_ShouldUpdateSpecialization()
        {
            // Arrange
            var specialization = new Specialization { Id = Guid.NewGuid(), Name = "Updated Name" };
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Specialization>())).ReturnsAsync(specialization);

            // Act
            var result = await _service.UpdateAsync(specialization);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetDoctorCountBySpecializationAsync_ShouldReturnDistribution()
        {
            // Arrange
            var distribution = new List<SpecializationDistributionDto>
            {
                new SpecializationDistributionDto { Name = "Cardiology", DoctorCount = 10 }
            };
            _repositoryMock.Setup(x => x.GetDoctorCountBySpecializationAsync()).ReturnsAsync(distribution);

            // Act
            var result = await _service.GetDoctorCountBySpecializationAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetDoctorCountBySpecializationAsync_WithException_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetDoctorCountBySpecializationAsync()).ThrowsAsync(new Exception("Error"));

            // Act
            var result = await _service.GetDoctorCountBySpecializationAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnFalse()
        {
            // Arrange
            var specializationId = Guid.NewGuid();

            // Act
            var result = await _service.DeleteAsync(specializationId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<Specialization>());

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetActiveAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetActiveAsync()).ReturnsAsync(new List<Specialization>());

            // Act
            var result = await _service.GetActiveAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetByCodeAsync_WithEmptyCode_ShouldReturnNull()
        {
            // Arrange
            var code = "";
            _repositoryMock.Setup(x => x.GetByCodeAsync(code)).ReturnsAsync((Specialization?)null);

            // Act
            var result = await _service.GetByCodeAsync(code);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreateAsync_WithNullSpecialization_ShouldReturnNull()
        {
            // Arrange
            _repositoryMock.Setup(x => x.CreateAsync(It.IsAny<Specialization>())).ReturnsAsync((Specialization?)null!);

            // Act
            var result = await _service.CreateAsync(null!);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithNullSpecialization_ShouldReturnNull()
        {
            // Arrange
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Specialization>())).ReturnsAsync((Specialization?)null!);

            // Act
            var result = await _service.UpdateAsync(null!);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetDoctorCountBySpecializationAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetDoctorCountBySpecializationAsync()).ReturnsAsync(new List<SpecializationDistributionDto>());

            // Act
            var result = await _service.GetDoctorCountBySpecializationAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }
    }
}

