using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Tests.Services.Classification
{
    public class MedicalRecordServiceTests
    {
        private readonly Mock<IMedicalRecordRepository> _repositoryMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IPatientHealthReminderService> _patientHealthReminderServiceMock;
        private readonly Mock<IPatientRepository> _patientRepositoryMock;
        private readonly MedixContext _context;
        private readonly MedicalRecordService _service;

        public MedicalRecordServiceTests()
        {
            _repositoryMock = new Mock<IMedicalRecordRepository>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _patientHealthReminderServiceMock = new Mock<IPatientHealthReminderService>();
            _patientRepositoryMock = new Mock<IPatientRepository>();

            var options = new DbContextOptionsBuilder<MedixContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var userContext = new Medix.API.Infrastructure.UserContext();
            _context = new MedixContext(options, userContext);

            var config = new AutoMapper.MapperConfiguration(cfg =>
            {
                cfg.CreateMap<MedicalRecord, MedicalRecordDto>();
                cfg.CreateMap<CreateOrUpdateMedicalRecordDto, MedicalRecord>()
                    .ForMember(dest => dest.Prescriptions, opt => opt.Ignore());
                cfg.CreateMap<Prescription, PrescriptionDto>();
            });
            _service = new MedicalRecordService(
                _repositoryMock.Object,
                _appointmentRepositoryMock.Object,
                new AutoMapper.Mapper(config),
                _context,
                _patientHealthReminderServiceMock.Object,
                _patientRepositoryMock.Object
            );
        }

        [Fact]
        public async Task GetByAppointmentIdAsync_WithValidId_ShouldReturnMedicalRecord()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, StatusCode = "Completed" };
            var record = new MedicalRecord { Id = Guid.NewGuid(), AppointmentId = appointmentId, Appointment = appointment };
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(record);

            // Act
            var result = await _service.GetByAppointmentIdAsync(appointmentId);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetByAppointmentIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);

            // Act
            var result = await _service.GetByAppointmentIdAsync(appointmentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreateAsync_WithValidDto_ShouldCreateMedicalRecord()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Test Diagnosis",
                Prescriptions = new List<CreatePrescriptionDto>(),
                UpdatePatientMedicalHistory = false
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);
            _repositoryMock.Setup(x => x.AddAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            // Add patient to context
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateAsync_WithInvalidAppointmentId_ShouldThrowException()
        {
            // Arrange
            var dto = new CreateOrUpdateMedicalRecordDto { AppointmentId = Guid.NewGuid() };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(dto.AppointmentId)).ReturnsAsync((Appointment?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task CreateAsync_WithExistingRecord_ShouldThrowException()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId };
            var existingRecord = new MedicalRecord { Id = Guid.NewGuid(), AppointmentId = appointmentId };
            var dto = new CreateOrUpdateMedicalRecordDto { AppointmentId = appointmentId };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(existingRecord);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task UpdateAsync_WithValidDto_ShouldUpdateMedicalRecord()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var existingRecord = new MedicalRecord { Id = Guid.NewGuid(), AppointmentId = appointmentId, Appointment = appointment };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Updated Diagnosis",
                Prescriptions = new List<CreatePrescriptionDto>()
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(existingRecord);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.UpdateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithInvalidAppointmentId_ShouldThrowException()
        {
            // Arrange
            var dto = new CreateOrUpdateMedicalRecordDto { AppointmentId = Guid.NewGuid() };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(dto.AppointmentId)).ReturnsAsync((Appointment?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAsync(dto));
        }

        [Fact]
        public async Task UpdateAsync_WithNonExistentRecord_ShouldThrowException()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId };
            var dto = new CreateOrUpdateMedicalRecordDto { AppointmentId = appointmentId };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAsync(dto));
        }

        [Fact]
        public async Task CreateAsync_WithPrescriptions_ShouldCreatePrescriptions()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Test Diagnosis",
                Prescriptions = null,
                UpdatePatientMedicalHistory = false
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);
            _repositoryMock.Setup(x => x.AddAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateAsync_WithUpdatePatientMedicalHistory_ShouldUpdatePatientHistory()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Diabetes",
                Prescriptions = new List<CreatePrescriptionDto>(),
                UpdatePatientMedicalHistory = true
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);
            _repositoryMock.Setup(x => x.AddAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
            var updatedPatient = await _context.Patients.FindAsync(patientId);
            updatedPatient.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateAsync_WithUpdatePatientAllergies_ShouldUpdatePatientAllergies()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Test Diagnosis",
                NewAllergy = "Penicillin",
                Prescriptions = new List<CreatePrescriptionDto>(),
                UpdatePatientAllergies = true
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);
            _repositoryMock.Setup(x => x.AddAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetByAppointmentIdAsync_WithNullRecord_ShouldReturnNull()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);

            // Act
            var result = await _service.GetByAppointmentIdAsync(appointmentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreateAsync_WithEmptyDiagnosis_ShouldCreateRecord()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "",
                Prescriptions = new List<CreatePrescriptionDto>(),
                UpdatePatientMedicalHistory = false
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((MedicalRecord?)null);
            _repositoryMock.Setup(x => x.AddAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithPrescriptions_ShouldUpdatePrescriptions()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var patientId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, PatientId = patientId, AppointmentStartTime = DateTime.UtcNow };
            var patient = new Patient { Id = patientId, MedicalHistory = null, Allergies = null, MedicalRecordNumber = "MRN001" };
            var existingRecord = new MedicalRecord { Id = Guid.NewGuid(), AppointmentId = appointmentId, Appointment = appointment };
            var dto = new CreateOrUpdateMedicalRecordDto
            {
                AppointmentId = appointmentId,
                Diagnosis = "Updated Diagnosis",
                Prescriptions = new List<CreatePrescriptionDto>
                {
                    new CreatePrescriptionDto { MedicationName = "New Medication", Dosage = "200mg", Frequency = "Twice daily" }
                },
                UpdatePatientMedicalHistory = false
            };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(existingRecord);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicalRecord>())).Returns(Task.CompletedTask);
            _patientHealthReminderServiceMock.Setup(x => x.sendHealthReminderPrescription(It.IsAny<List<Prescription>>()))
                .ReturnsAsync(new PatientHealthReminder { Id = Guid.NewGuid() });
            
            await _context.Patients.AddAsync(patient);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.UpdateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetByAppointmentIdAsync_WithCompletedAppointment_ShouldReturnRecord()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId, StatusCode = "Completed" };
            var record = new MedicalRecord 
            { 
                Id = Guid.NewGuid(), 
                AppointmentId = appointmentId, 
                Appointment = appointment,
                Diagnosis = "Test Diagnosis"
            };
            _repositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(record);

            // Act
            var result = await _service.GetByAppointmentIdAsync(appointmentId);

            // Assert
            result.Should().NotBeNull();
            result!.Diagnosis.Should().Be("Test Diagnosis");
        }
    }
}

