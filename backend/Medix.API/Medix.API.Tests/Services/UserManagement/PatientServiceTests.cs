using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.Patient;
using Medix.API.Models.Entities;

namespace Medix.API.Tests.Services.UserManagement
{
    public class PatientServiceTests
    {
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly PatientService _service;

        public PatientServiceTests()
        {
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _service = new PatientService(_patientRepositoryMock.Object, _userRepositoryMock.Object);
        }

        [Fact]
        public async Task RegisterPatientAsync_WithValidData_ShouldCreatePatient()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new PatientDTO
            {
                BloodTypeCode = "A+",
                Height = 170,
                Weight = 70,
                MedicalHistory = "None",
                Allergies = "None"
            };
            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MedicalRecordNumber = "MRN001",
                BloodTypeCode = dto.BloodTypeCode
            };
            _patientRepositoryMock.Setup(x => x.SavePatientAsync(It.IsAny<Patient>())).ReturnsAsync(patient);

            // Act
            var result = await _service.RegisterPatientAsync(dto, userId);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(userId);
        }

        [Fact]
        public async Task GetByUserIdAsync_WithValidUserId_ShouldReturnPatient()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BloodTypeCode = "A+",
                EmergencyContactName = "Contact",
                EmergencyContactPhone = "0123456789"
            };
            _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(userId)).ReturnsAsync(patient);

            // Act
            var result = await _service.GetByUserIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.UserId.Should().Be(userId);
        }

        [Fact]
        public async Task GetByUserIdAsync_WithInvalidUserId_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(userId)).ReturnsAsync((Patient?)null);

            // Act
            var result = await _service.GetByUserIdAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnNull()
        {
            // Arrange
            var patientId = Guid.NewGuid();

            // Act
            var result = await _service.GetByIdAsync(patientId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task RegisterPatientAsync_WithNullDto_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.RegisterPatientAsync(null!, userId));
        }

        [Fact]
        public async Task RegisterPatientAsync_WithEmptyUserId_ShouldCreatePatient()
        {
            // Arrange
            var userId = Guid.Empty;
            var dto = new PatientDTO
            {
                BloodTypeCode = "A+",
                Height = 170,
                Weight = 70
            };
            var patient = new Patient { Id = Guid.NewGuid(), UserId = userId };
            _patientRepositoryMock.Setup(x => x.SavePatientAsync(It.IsAny<Patient>())).ReturnsAsync(patient);

            // Act
            var result = await _service.RegisterPatientAsync(dto, userId);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetByUserIdAsync_WithEmptyUserId_ShouldReturnNull()
        {
            // Arrange
            var userId = Guid.Empty;
            _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(userId)).ReturnsAsync((Patient?)null);

            // Act
            var result = await _service.GetByUserIdAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_WithEmptyId_ShouldReturnNull()
        {
            // Arrange
            var patientId = Guid.Empty;

            // Act
            var result = await _service.GetByIdAsync(patientId);

            // Assert
            result.Should().BeNull();
        }
    }
}

