using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess;
using Medix.API.Models.Entities;
using Medix.API.Models.DTOs.Doctor;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Tests.Services.Classification
{
    public class DoctorServiceTests
    {
        private readonly Mock<IDoctorRepository> _doctorRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IReviewRepository> _reviewRepositoryMock;
        private readonly Mock<IServiceTierRepository> _serviceTierRepositoryMock;
        private readonly Mock<IDoctorScheduleRepository> _doctorScheduleRepositoryMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IDoctorScheduleOverrideRepository> _doctorScheduleOverrideRepositoryMock;
        private readonly Mock<IAppointmentService> _appointmentServiceMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly MedixContext _context;
        private readonly DoctorService _doctorService;

        public DoctorServiceTests()
        {
            _doctorRepositoryMock = new Mock<IDoctorRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _reviewRepositoryMock = new Mock<IReviewRepository>();
            _serviceTierRepositoryMock = new Mock<IServiceTierRepository>();
            _doctorScheduleRepositoryMock = new Mock<IDoctorScheduleRepository>();
            _emailServiceMock = new Mock<IEmailService>();
            _doctorScheduleOverrideRepositoryMock = new Mock<IDoctorScheduleOverrideRepository>();
            _appointmentServiceMock = new Mock<IAppointmentService>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();

            var options = new DbContextOptionsBuilder<MedixContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var userContext = new Medix.API.Infrastructure.UserContext();
            _context = new MedixContext(options, userContext);

            _doctorService = new DoctorService(
                _doctorRepositoryMock.Object,
                _userRepositoryMock.Object,
                _context,
                _reviewRepositoryMock.Object,
                _serviceTierRepositoryMock.Object,
                _serviceTierRepositoryMock.Object,
                _doctorScheduleRepositoryMock.Object,
                _emailServiceMock.Object,
                _doctorScheduleOverrideRepositoryMock.Object,
                _appointmentServiceMock.Object,
                _appointmentRepositoryMock.Object
            );
        }

        [Fact]
        public async Task GetHomePageDoctorsAsync_ShouldReturnDoctors()
        {
            // Arrange
            var doctors = new List<Doctor>
            {
                new Doctor { Id = Guid.NewGuid(), AverageRating = 4.5m }
            };
            _doctorRepositoryMock.Setup(x => x.GetHomePageDoctorsAsync()).ReturnsAsync(doctors);

            // Act
            var result = await _doctorService.GetHomePageDoctorsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetHomePageDoctorsAsync_WithNoDoctors_ShouldReturnEmptyList()
        {
            // Arrange
            _doctorRepositoryMock.Setup(x => x.GetHomePageDoctorsAsync()).ReturnsAsync(new List<Doctor>());

            // Act
            var result = await _doctorService.GetHomePageDoctorsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithValidData_ShouldReturnTrue()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, Education = "Old Education", ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _doctorRepositoryMock.Setup(x => x.UpdateDoctorAsync(It.IsAny<Doctor>())).ReturnsAsync(doctor);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, "New Education", 200000);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithInvalidDoctorId_ShouldReturnFalse()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync((Doctor?)null);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, "Education", 200000);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithNegativeFee_ShouldThrowException()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, null, -100));
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithSameValues_ShouldReturnTrue()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, Education = "Education", ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, "Education", 100000);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task GetDoctorBusinessStatsAsync_WithValidDoctorId_ShouldReturnStats()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId };
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Completed", TotalAmount = 200000 }
            };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _appointmentRepositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _reviewRepositoryMock.Setup(x => x.GetReviewsByDoctorAsync(doctorId)).ReturnsAsync(new List<Review>());

            // Act
            var result = await _doctorService.GetDoctorBusinessStatsAsync(doctorId);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetDoctorBusinessStatsAsync_WithInvalidDoctorId_ShouldReturnNull()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync((Doctor?)null);

            // Act
            var result = await _doctorService.GetDoctorBusinessStatsAsync(doctorId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetDoctorBusinessStatsAsync_WithDateRange_ShouldFilterAppointments()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId };
            var startDate = DateTime.UtcNow.AddDays(-30);
            var endDate = DateTime.UtcNow;
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), AppointmentStartTime = DateTime.UtcNow, StatusCode = "Completed" }
            };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _appointmentRepositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _reviewRepositoryMock.Setup(x => x.GetReviewsByDoctorAsync(doctorId)).ReturnsAsync(new List<Review>());

            // Act
            var result = await _doctorService.GetDoctorBusinessStatsAsync(doctorId, startDate, endDate);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetHomePageDoctorsAsync_WithMultipleDoctors_ShouldReturnAll()
        {
            // Arrange
            var doctors = new List<Doctor>
            {
                new Doctor { Id = Guid.NewGuid(), AverageRating = 4.5m },
                new Doctor { Id = Guid.NewGuid(), AverageRating = 4.8m },
                new Doctor { Id = Guid.NewGuid(), AverageRating = 4.2m }
            };
            _doctorRepositoryMock.Setup(x => x.GetHomePageDoctorsAsync()).ReturnsAsync(doctors);

            // Act
            var result = await _doctorService.GetHomePageDoctorsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithNullEducation_ShouldUpdateFeeOnly()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, Education = "Old Education", ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _doctorRepositoryMock.Setup(x => x.UpdateDoctorAsync(It.IsAny<Doctor>())).ReturnsAsync(doctor);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, null, 200000);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithZeroFee_ShouldReturnTrue()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _doctorRepositoryMock.Setup(x => x.UpdateDoctorAsync(It.IsAny<Doctor>())).ReturnsAsync(doctor);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, "Education", 0);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task GetDoctorBusinessStatsAsync_WithNoAppointments_ShouldReturnZeroStats()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _appointmentRepositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _reviewRepositoryMock.Setup(x => x.GetReviewsByDoctorAsync(doctorId)).ReturnsAsync(new List<Review>());

            // Act
            var result = await _doctorService.GetDoctorBusinessStatsAsync(doctorId);

            // Assert
            result.Should().NotBeNull();
            result.TotalBookings.Should().Be(0);
        }

        [Fact]
        public async Task GetDoctorBusinessStatsAsync_WithMultipleAppointments_ShouldCalculateCorrectly()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId };
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Completed", TotalAmount = 200000, AppointmentStartTime = DateTime.UtcNow },
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Completed", TotalAmount = 300000, AppointmentStartTime = DateTime.UtcNow },
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Cancelled", TotalAmount = 200000, AppointmentStartTime = DateTime.UtcNow }
            };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);
            _appointmentRepositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _reviewRepositoryMock.Setup(x => x.GetReviewsByDoctorAsync(doctorId)).ReturnsAsync(new List<Review>());

            // Act
            var result = await _doctorService.GetDoctorBusinessStatsAsync(doctorId);

            // Assert
            result.Should().NotBeNull();
            result.TotalBookings.Should().BeGreaterThanOrEqualTo(0);
        }

        [Fact]
        public async Task GetHomePageDoctorsAsync_WithHighRating_ShouldReturnDoctors()
        {
            // Arrange
            var doctors = new List<Doctor>
            {
                new Doctor { Id = Guid.NewGuid(), AverageRating = 5.0m },
                new Doctor { Id = Guid.NewGuid(), AverageRating = 4.9m }
            };
            _doctorRepositoryMock.Setup(x => x.GetHomePageDoctorsAsync()).ReturnsAsync(doctors);

            // Act
            var result = await _doctorService.GetHomePageDoctorsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task UpdateDoctorEducationAndFeeAsync_WithBothNull_ShouldReturnTrue()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var doctor = new Doctor { Id = doctorId, Education = "Education", ConsultationFee = 100000 };
            _doctorRepositoryMock.Setup(x => x.GetDoctorByIdAsync(doctorId)).ReturnsAsync(doctor);

            // Act
            var result = await _doctorService.UpdateDoctorEducationAndFeeAsync(doctorId, null, null);

            // Assert
            result.Should().BeTrue();
        }
    }
}

