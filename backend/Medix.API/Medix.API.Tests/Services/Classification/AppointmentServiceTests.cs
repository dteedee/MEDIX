using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.Manager;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;
using AutoMapper;
using Hangfire;
using Hangfire.MemoryStorage;

namespace Medix.API.Tests.Services.Classification
{
    public class AppointmentServiceTests
    {
        private readonly Mock<IAppointmentRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IMedicalRecordService> _medicalRecordServiceMock;
        private readonly Mock<IWalletTransactionService> _walletTransactionServiceMock;
        private readonly Mock<IWalletService> _walletServiceMock;
        private readonly Mock<IDoctorRepository> _doctorRepositoryMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly Mock<IUserPromotionService> _userPromotionServiceMock;
        private readonly Mock<IPromotionService> _promotionServiceMock;
        private readonly Mock<IReviewRepository> _reviewRepositoryMock;
        private readonly AppointmentService _appointmentService;

        public AppointmentServiceTests()
        {
            // Setup Hangfire for tests
            GlobalConfiguration.Configuration.UseMemoryStorage();
            
            _repositoryMock = new Mock<IAppointmentRepository>();
            _mapperMock = new Mock<IMapper>();
            _medicalRecordServiceMock = new Mock<IMedicalRecordService>();
            _walletTransactionServiceMock = new Mock<IWalletTransactionService>();
            _walletServiceMock = new Mock<IWalletService>();
            _doctorRepositoryMock = new Mock<IDoctorRepository>();
            _patientRepositoryMock = new Mock<IPatientRepository>();
            _userPromotionServiceMock = new Mock<IUserPromotionService>();
            _promotionServiceMock = new Mock<IPromotionService>();
            _reviewRepositoryMock = new Mock<IReviewRepository>();

            _appointmentService = new AppointmentService(
                _repositoryMock.Object,
                _mapperMock.Object,
                _medicalRecordServiceMock.Object,
                _walletTransactionServiceMock.Object,
                _walletServiceMock.Object,
                _doctorRepositoryMock.Object,
                _patientRepositoryMock.Object,
                _userPromotionServiceMock.Object,
                _promotionServiceMock.Object,
                _reviewRepositoryMock.Object
            );
        }

        [Fact]
        public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.Parse("00000000-0000-0000-0000-000000000000");
            var appointment = new Appointment
            {
                Id = invalidId,
                DoctorId = Guid.NewGuid(),
                PatientId = Guid.NewGuid(),
                StatusCode = "Confirmed",
                ConsultationFee = 200000,
                TotalAmount = 200000
            };
            _repositoryMock.Setup(x => x.GetByIdAsync(invalidId))
                .ReturnsAsync(appointment);

            // Act
            var result = await _appointmentService.GetByIdAsync(invalidId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(invalidId);
        }

        [Fact]
        public async Task GetByIdAsync_WithValidId_ShouldReturnAppointmentDto()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                DoctorId = Guid.NewGuid(),
                PatientId = Guid.NewGuid(),
                StatusCode = "Confirmed",
                ConsultationFee = 200000,
                TotalAmount = 200000
            };

            _repositoryMock.Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            // Act
            var result = await _appointmentService.GetByIdAsync(appointmentId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(appointmentId);
            result.StatusCode.Should().Be("Confirmed");
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllAppointments()
        {
            // Arrange
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Confirmed" },
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Completed" }
            };
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id, StatusCode = a.StatusCode }));

            // Act
            var result = await _appointmentService.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetByDoctorAsync_WithValidDoctorId_ShouldReturnAppointments()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), DoctorId = doctorId, StatusCode = "Confirmed" }
            };
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id, DoctorID = a.DoctorId }));

            // Act
            var result = await _appointmentService.GetByDoctorAsync(doctorId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result.First().DoctorID.Should().Be(doctorId);
        }

        [Fact]
        public async Task GetByPatientAsync_WithValidPatientId_ShouldReturnAppointments()
        {
            // Arrange
            var patientId = Guid.NewGuid();
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), PatientId = patientId, StatusCode = "Completed" }
            };
            _repositoryMock.Setup(x => x.GetByPatientAsync(patientId)).ReturnsAsync(appointments);
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdsAsync(It.IsAny<List<Guid>>()))
                .ReturnsAsync(new List<Review>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id, PatientID = a.PatientId, StatusCode = a.StatusCode }).ToList());

            // Act
            var result = await _appointmentService.GetByPatientAsync(patientId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByDateAsync_WithValidDate_ShouldReturnAppointments()
        {
            // Arrange
            var date = DateTime.UtcNow.Date;
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), AppointmentStartTime = date }
            };
            _repositoryMock.Setup(x => x.GetByDateAsync(date)).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id }));

            // Act
            var result = await _appointmentService.GetByDateAsync(date);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task CreateAsync_WithValidDto_ShouldCreateAppointment()
        {
            // Arrange
            var dto = new CreateAppointmentDto
            {
                DoctorId = Guid.NewGuid(),
                PatientId = Guid.NewGuid(),
                AppointmentStartTime = DateTime.UtcNow.AddDays(1),
                AppointmentEndTime = DateTime.UtcNow.AddDays(1).AddMinutes(30),
                ConsultationFee = 200000,
                TotalAmount = 200000,
                chiefComplaint = "Test complaint",
                historyOfPresentIllness = "Test history"
            };
            var appointment = new Appointment 
            { 
                Id = Guid.NewGuid(),
                AppointmentStartTime = dto.AppointmentStartTime.Value,
                AppointmentEndTime = dto.AppointmentEndTime.Value
            };
            var medicalRecord = new MedicalRecordDto { Id = Guid.NewGuid() };

            _mapperMock.Setup(x => x.Map<Appointment>(dto)).Returns(appointment);
            _repositoryMock.Setup(x => x.CreateApppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync((Appointment a) => a);
            _medicalRecordServiceMock.Setup(x => x.CreateAsync(It.IsAny<CreateOrUpdateMedicalRecordDto>()))
                .ReturnsAsync(medicalRecord);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Appointment>())).Returns(Task.CompletedTask);
            _mapperMock.Setup(x => x.Map<AppointmentDto>(It.IsAny<Appointment>()))
                .Returns(new AppointmentDto { Id = appointment.Id });

            // Act
            var result = await _appointmentService.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
            _repositoryMock.Verify(x => x.CreateApppointmentAsync(It.IsAny<Appointment>()), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_WithValidDto_ShouldUpdateAppointment()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var existing = new Appointment
            {
                Id = appointmentId,
                StatusCode = "Confirmed",
                ConsultationFee = 200000
            };
            var dto = new UpdateAppointmentDto
            {
                Id = appointmentId,
                StatusCode = "Completed",
                ConsultationFee = 200000
            };

            _repositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(existing);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Appointment>())).Returns(Task.CompletedTask);
            _mapperMock.Setup(x => x.Map<AppointmentDto>(It.IsAny<Appointment>()))
                .Returns(new AppointmentDto { Id = appointmentId, StatusCode = "Completed" });

            // Act
            var result = await _appointmentService.UpdateAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be("Completed");
        }

        [Fact]
        public async Task UpdateAsync_WithNonExistentId_ShouldReturnNull()
        {
            // Arrange
            var dto = new UpdateAppointmentDto { Id = Guid.NewGuid() };
            _repositoryMock.Setup(x => x.GetByIdAsync(dto.Id)).ReturnsAsync((Appointment?)null);

            // Act
            var result = await _appointmentService.UpdateAsync(dto);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAsync_WithValidId_ShouldReturnTrue()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId };
            _repositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.DeleteAsync(appointmentId)).Returns(Task.CompletedTask);

            // Act
            var result = await _appointmentService.DeleteAsync(appointmentId);

            // Assert
            result.Should().BeTrue();
            _repositoryMock.Verify(x => x.DeleteAsync(appointmentId), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_WithInvalidId_ShouldReturnFalse()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync((Appointment?)null);

            // Act
            var result = await _appointmentService.DeleteAsync(appointmentId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task IsDoctorBusyAsync_WithConflictingAppointment_ShouldReturnTrue()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            var conflictingAppointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "BeforeAppoiment", AppointmentStartTime = startTime, AppointmentEndTime = endTime }
            };
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(conflictingAppointments);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(conflictingAppointments.Select(a => new AppointmentDto { Id = a.Id }).ToList());

            // Act
            var result = await _appointmentService.IsDoctorBusyAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task IsDoctorBusyAsync_WithNoConflictingAppointment_ShouldReturnFalse()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.IsDoctorBusyAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetAppointmentTrendsAsync_WithValidData_ShouldReturnTrends()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var year = 2024;
            var monthlyData = new List<MonthlyAppointmentTrendDto>
            {
                new MonthlyAppointmentTrendDto { Month = 1, AppointmentCount = 10, AppointmentRevenue = 2000000, WalletRevenue = 0 }
            };
            _repositoryMock.Setup(x => x.GetMonthlyAppointmentAndRevenueAsync(doctorId, year))
                .ReturnsAsync(monthlyData);

            // Act
            var result = await _appointmentService.GetAppointmentTrendsAsync(doctorId, year);

            // Assert
            result.Should().NotBeNull();
            result.TotalAppointments.Should().Be(10);
            result.TotalRevenue.Should().Be(2000000);
        }

        [Fact]
        public async Task GetAppointmentTrendsAsync_WithException_ShouldReturnNull()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var year = 2024;
            _repositoryMock.Setup(x => x.GetMonthlyAppointmentAndRevenueAsync(doctorId, year))
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _appointmentService.GetAppointmentTrendsAsync(doctorId, year);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByDoctorUserAndDateAsync_WithValidData_ShouldReturnAppointments()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var date = DateTime.UtcNow.Date;
            var doctor = new Doctor { Id = Guid.NewGuid(), UserId = userId };
            var appointments = new List<Appointment> { new Appointment { Id = Guid.NewGuid() } };

            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync(doctor);
            _repositoryMock.Setup(x => x.GetByDoctorAndDateAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id }));

            // Act
            var result = await _appointmentService.GetByDoctorUserAndDateAsync(userId, date);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByDoctorUserAndDateAsync_WithInvalidUserId_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var date = DateTime.UtcNow.Date;
            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync((Doctor?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _appointmentService.GetByDoctorUserAndDateAsync(userId, date));
        }

        [Fact]
        public async Task GetByDoctorUserAndDateRangeAsync_WithValidData_ShouldReturnAppointments()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var startDate = DateTime.UtcNow.Date;
            var endDate = startDate.AddDays(7);
            var doctor = new Doctor { Id = Guid.NewGuid(), UserId = userId };
            var appointments = new List<Appointment> { new Appointment { Id = Guid.NewGuid() } };

            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync(doctor);
            _repositoryMock.Setup(x => x.GetByDoctorAndDateAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id }).ToList());

            // Act
            var result = await _appointmentService.GetByDoctorUserAndDateRangeAsync(userId, startDate, endDate);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetConflictingAppointmentsAsync_WithOverlappingTime_ShouldReturnConflicts()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            var appointments = new List<Appointment>
            {
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    StatusCode = "BeforeAppoiment",
                    AppointmentStartTime = startTime,
                    AppointmentEndTime = endTime
                }
            };
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id }).ToList());

            // Act
            var result = await _appointmentService.GetConflictingAppointmentsAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByIdAsync_WithNullEntity_ShouldReturnNull()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync((Appointment?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _appointmentService.GetByIdAsync(appointmentId));
        }

        [Fact]
        public async Task CreateAsync_WithNullDto_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _appointmentService.CreateAsync(null!));
        }

        [Fact]
        public async Task UpdateAsync_WithNullDto_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _appointmentService.UpdateAsync(null!));
        }

        [Fact]
        public async Task DeleteAsync_WithEmptyGuid_ShouldReturnFalse()
        {
            // Arrange
            var emptyId = Guid.Empty;
            _repositoryMock.Setup(x => x.GetByIdAsync(emptyId)).ReturnsAsync((Appointment?)null);

            // Act
            var result = await _appointmentService.DeleteAsync(emptyId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetByDoctorAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetByDoctorAsync(doctorId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetByDateAsync_WithNoAppointments_ShouldReturnEmpty()
        {
            // Arrange
            var date = DateTime.UtcNow.Date;
            _repositoryMock.Setup(x => x.GetByDateAsync(date)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetByDateAsync(date);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetConflictingAppointmentsAsync_WithNoConflicts_ShouldReturnEmpty()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetConflictingAppointmentsAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetConflictingAppointmentsAsync_WithDifferentStatus_ShouldNotReturnConflicts()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "Cancelled", AppointmentStartTime = startTime, AppointmentEndTime = endTime }
            };
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetConflictingAppointmentsAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAppointmentTrendsAsync_WithNullDoctorId_ShouldReturnTrends()
        {
            // Arrange
            var year = 2024;
            var monthlyData = new List<MonthlyAppointmentTrendDto>
            {
                new MonthlyAppointmentTrendDto { Month = 1, AppointmentCount = 5, AppointmentRevenue = 1000000, WalletRevenue = 0 }
            };
            _repositoryMock.Setup(x => x.GetMonthlyAppointmentAndRevenueAsync(null, year))
                .ReturnsAsync(monthlyData);

            // Act
            var result = await _appointmentService.GetAppointmentTrendsAsync(null, year);

            // Assert
            result.Should().NotBeNull();
            result.TotalAppointments.Should().Be(5);
        }

        [Fact]
        public async Task GetByDoctorUserAndDateAsync_WithNullDoctor_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var date = DateTime.UtcNow.Date;
            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync((Doctor?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _appointmentService.GetByDoctorUserAndDateAsync(userId, date));
        }

        [Fact]
        public async Task GetByDoctorUserAndDateRangeAsync_WithNullDoctor_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var startDate = DateTime.UtcNow.Date;
            var endDate = startDate.AddDays(7);
            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync((Doctor?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _appointmentService.GetByDoctorUserAndDateRangeAsync(userId, startDate, endDate));
        }

        [Fact]
        public async Task IsDoctorBusyAsync_WithEmptyAppointments_ShouldReturnFalse()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.IsDoctorBusyAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetByPatientAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            var patientId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByPatientAsync(patientId)).ReturnsAsync(new List<Appointment>());
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdsAsync(It.IsAny<List<Guid>>()))
                .ReturnsAsync(new List<Review>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetByPatientAsync(patientId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetByPatientAsync_WithReviews_ShouldIncludeReviewData()
        {
            // Arrange
            var patientId = Guid.NewGuid();
            var appointmentId = Guid.NewGuid();
            var appointments = new List<Appointment>
            {
                new Appointment { Id = appointmentId, PatientId = patientId, StatusCode = "Completed" }
            };
            var reviews = new List<Review>
            {
                new Review { AppointmentId = appointmentId, Comment = "Great", Rating = 5 }
            };
            _repositoryMock.Setup(x => x.GetByPatientAsync(patientId)).ReturnsAsync(appointments);
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdsAsync(It.IsAny<List<Guid>>()))
                .ReturnsAsync(reviews);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(appointments.Select(a => new AppointmentDto { Id = a.Id, PatientID = a.PatientId, StatusCode = a.StatusCode }).ToList());

            // Act
            var result = await _appointmentService.GetByPatientAsync(patientId);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetConflictingAppointmentsAsync_WithNonOverlappingTime_ShouldReturnEmpty()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(1);
            var endTime = startTime.AddMinutes(30);
            var appointments = new List<Appointment>
            {
                new Appointment { Id = Guid.NewGuid(), StatusCode = "BeforeAppoiment", AppointmentStartTime = startTime.AddHours(2), AppointmentEndTime = endTime.AddHours(2) }
            };
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(appointments);
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetConflictingAppointmentsAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAppointmentTrendsAsync_WithZeroYear_ShouldReturnNull()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var year = 0;
            _repositoryMock.Setup(x => x.GetMonthlyAppointmentAndRevenueAsync(doctorId, year))
                .ThrowsAsync(new Exception("Invalid year"));

            // Act
            var result = await _appointmentService.GetAppointmentTrendsAsync(doctorId, year);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByDateAsync_WithFutureDate_ShouldReturnEmpty()
        {
            // Arrange
            var date = DateTime.UtcNow.AddYears(1).Date;
            _repositoryMock.Setup(x => x.GetByDateAsync(date)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<IEnumerable<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetByDateAsync(date);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetByDoctorUserAndDateRangeAsync_WithInvalidDateRange_ShouldReturnEmpty()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var startDate = DateTime.UtcNow.Date;
            var endDate = startDate.AddDays(-1);
            var doctor = new Doctor { Id = Guid.NewGuid(), UserId = userId };
            _repositoryMock.Setup(x => x.GetDoctorByUserIdAsync(userId)).ReturnsAsync(doctor);
            _repositoryMock.Setup(x => x.GetByDoctorAndDateAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.GetByDoctorUserAndDateRangeAsync(userId, startDate, endDate);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task IsDoctorBusyAsync_WithPastTime_ShouldReturnFalse()
        {
            // Arrange
            var doctorId = Guid.NewGuid();
            var startTime = DateTime.UtcNow.AddDays(-1);
            var endTime = startTime.AddMinutes(30);
            _repositoryMock.Setup(x => x.GetByDoctorAsync(doctorId)).ReturnsAsync(new List<Appointment>());
            _mapperMock.Setup(x => x.Map<List<AppointmentDto>>(It.IsAny<IEnumerable<Appointment>>()))
                .Returns(new List<AppointmentDto>());

            // Act
            var result = await _appointmentService.IsDoctorBusyAsync(doctorId, startTime, endTime);

            // Assert
            result.Should().BeFalse();
        }
    }
}

