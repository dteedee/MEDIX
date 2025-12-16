using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicationDTO;
using Medix.API.Models.Entities;
using AutoMapper;

namespace Medix.API.Tests.Services.Classification
{
    public class MedicationServiceTests
    {
        private readonly Mock<IMedicationRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly MedicationService _service;

        public MedicationServiceTests()
        {
            _repositoryMock = new Mock<IMedicationRepository>();
            _mapperMock = new Mock<IMapper>();
            _service = new MedicationService(_repositoryMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllMedications()
        {
            // Arrange
            var medications = new List<MedicationDatabase>
            {
                new MedicationDatabase { Id = Guid.NewGuid(), MedicationName = "Med1" }
            };
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(medications);
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(medications.Select(m => new MedicationDto { Id = m.Id, MedicationName = m.MedicationName }));

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByIdAsync_WithValidId_ShouldReturnMedication()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var medication = new MedicationDatabase { Id = medicationId, MedicationName = "Med1" };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(medication);
            _mapperMock.Setup(x => x.Map<MedicationDto>(medication))
                .Returns(new MedicationDto { Id = medicationId, MedicationName = "Med1" });

            // Act
            var result = await _service.GetByIdAsync(medicationId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(medicationId);
        }

        [Fact]
        public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync((MedicationDatabase?)null);

            // Act
            var result = await _service.GetByIdAsync(medicationId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task SearchAsync_WithValidQuery_ShouldReturnMedications()
        {
            // Arrange
            var query = "aspirin";
            var medications = new List<MedicationDatabase>
            {
                new MedicationDatabase { Id = Guid.NewGuid(), MedicationName = "Aspirin" }
            };
            _repositoryMock.Setup(x => x.SearchAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(medications);
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationSearchDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(medications.Select(m => new MedicationSearchDto { Id = m.Id, Name = m.MedicationName }));

            // Act
            var result = await _service.SearchAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task CreateAsync_WithValidDto_ShouldCreateMedication()
        {
            // Arrange
            var dto = new MedicationCreateDto
            {
                MedicationName = "New Medication",
                GenericName = "Generic",
                IsActive = true
            };
            var medication = new MedicationDatabase { Id = Guid.NewGuid(), MedicationName = dto.MedicationName };
            _repositoryMock.Setup(x => x.CreateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync(medication);
            _mapperMock.Setup(x => x.Map<MedicationDto>(It.IsAny<MedicationDatabase>()))
                .Returns(new MedicationDto { Id = medication.Id, MedicationName = medication.MedicationName });

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.MedicationName.Should().Be(dto.MedicationName);
        }

        [Fact]
        public async Task UpdateAsync_WithValidId_ShouldUpdateMedication()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var existing = new MedicationDatabase { Id = medicationId, MedicationName = "Old Name" };
            var dto = new MedicationUpdateDto { MedicationName = "New Name" };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(existing);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync(existing);
            _mapperMock.Setup(x => x.Map<MedicationDto>(It.IsAny<MedicationDatabase>()))
                .Returns(new MedicationDto { Id = medicationId, MedicationName = "New Name" });

            // Act
            var result = await _service.UpdateAsync(medicationId, dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateAsync_WithInvalidId_ShouldThrowException()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var dto = new MedicationUpdateDto { MedicationName = "New Name" };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync((MedicationDatabase?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateAsync(medicationId, dto));
        }

        [Fact]
        public async Task ToggleActiveAsync_WithValidId_ShouldToggleStatus()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var medication = new MedicationDatabase { Id = medicationId, IsActive = false };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(medication);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync((MedicationDatabase m) => m);

            // Act
            var result = await _service.ToggleActiveAsync(medicationId);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task GetAllIncludingInactiveAsync_ShouldReturnAllMedications()
        {
            // Arrange
            var medications = new List<MedicationDatabase>
            {
                new MedicationDatabase { Id = Guid.NewGuid(), IsActive = true },
                new MedicationDatabase { Id = Guid.NewGuid(), IsActive = false }
            };
            _repositoryMock.Setup(x => x.GetAllIncludingInactiveAsync()).ReturnsAsync(medications);
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(medications.Select(m => new MedicationDto { Id = m.Id, IsActive = m.IsActive }));

            // Act
            var result = await _service.GetAllIncludingInactiveAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetAllAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<MedicationDatabase>());
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(new List<MedicationDto>());

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task SearchAsync_WithEmptyQuery_ShouldReturnEmpty()
        {
            // Arrange
            var query = "";
            _repositoryMock.Setup(x => x.SearchAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(new List<MedicationDatabase>());
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationSearchDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(new List<MedicationSearchDto>());

            // Act
            var result = await _service.SearchAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task CreateAsync_WithNullDto_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.CreateAsync(null!));
        }

        [Fact]
        public async Task UpdateAsync_WithNullDto_ShouldThrowException()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var medication = new MedicationDatabase { Id = medicationId };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(medication);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.UpdateAsync(medicationId, null!));
        }

        [Fact]
        public async Task ToggleActiveAsync_WithInvalidId_ShouldThrowException()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync((MedicationDatabase?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.ToggleActiveAsync(medicationId));
        }

        [Fact]
        public async Task ToggleActiveAsync_WithFalseStatus_ShouldReturnTrue()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var medication = new MedicationDatabase { Id = medicationId, IsActive = false };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(medication);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync((MedicationDatabase m) => m);

            // Act
            var result = await _service.ToggleActiveAsync(medicationId);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task GetAllIncludingInactiveAsync_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.GetAllIncludingInactiveAsync()).ReturnsAsync(new List<MedicationDatabase>());
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(new List<MedicationDto>());

            // Act
            var result = await _service.GetAllIncludingInactiveAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task SearchAsync_WithNoMatches_ShouldReturnEmpty()
        {
            // Arrange
            var query = "nonexistent";
            _repositoryMock.Setup(x => x.SearchAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(new List<MedicationDatabase>());
            _mapperMock.Setup(x => x.Map<IEnumerable<MedicationSearchDto>>(It.IsAny<IEnumerable<MedicationDatabase>>()))
                .Returns(new List<MedicationSearchDto>());

            // Act
            var result = await _service.SearchAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task CreateAsync_WithInactiveMedication_ShouldCreateInactive()
        {
            // Arrange
            var dto = new MedicationCreateDto
            {
                MedicationName = "Test Medication",
                GenericName = "Generic",
                IsActive = false
            };
            var medication = new MedicationDatabase { Id = Guid.NewGuid(), MedicationName = dto.MedicationName, IsActive = false };
            _repositoryMock.Setup(x => x.CreateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync(medication);
            _mapperMock.Setup(x => x.Map<MedicationDto>(It.IsAny<MedicationDatabase>()))
                .Returns(new MedicationDto { Id = medication.Id, MedicationName = medication.MedicationName, IsActive = false });

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.IsActive.Should().BeFalse();
        }

        [Fact]
        public async Task UpdateAsync_WithAllFields_ShouldUpdateAll()
        {
            // Arrange
            var medicationId = Guid.NewGuid();
            var existing = new MedicationDatabase { Id = medicationId, MedicationName = "Old Name", GenericName = "Old Generic" };
            var dto = new MedicationUpdateDto 
            { 
                MedicationName = "New Name",
                GenericName = "New Generic",
                DosageForms = "Tablet",
                CommonUses = "Pain relief",
                SideEffects = "None",
                IsActive = true
            };
            _repositoryMock.Setup(x => x.GetByIdAsync(medicationId)).ReturnsAsync(existing);
            _repositoryMock.Setup(x => x.UpdateAsync(It.IsAny<MedicationDatabase>())).ReturnsAsync(existing);
            _mapperMock.Setup(x => x.Map<MedicationDto>(It.IsAny<MedicationDatabase>()))
                .Returns(new MedicationDto { Id = medicationId, MedicationName = "New Name" });

            // Act
            var result = await _service.UpdateAsync(medicationId, dto);

            // Assert
            result.Should().NotBeNull();
        }
    }
}

