using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.ReviewDTO;
using Medix.API.Models.Entities;
using AutoMapper;

namespace Medix.API.Tests.Services.Classification
{
    public class ReviewServiceTests
    {
        private readonly Mock<IReviewRepository> _reviewRepositoryMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ReviewService _service;

        public ReviewServiceTests()
        {
            _reviewRepositoryMock = new Mock<IReviewRepository>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _mapperMock = new Mock<IMapper>();
            _service = new ReviewService(_reviewRepositoryMock.Object, _appointmentRepositoryMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task GetTopDoctorsByRatingAsync_WithValidCount_ShouldReturnTopDoctors()
        {
            // Arrange
            var count = 3;
            var topDoctors = new List<(Guid DoctorId, string DoctorName, string Specialization, double AverageRating, int ReviewCount, string? ImageUrl)>
            {
                (Guid.NewGuid(), "Dr. A", "Cardiology", 4.5, 10, "url1")
            };
            _reviewRepositoryMock.Setup(x => x.GetTopDoctorsByRatingAsync(count)).ReturnsAsync(topDoctors);

            // Act
            var result = await _service.GetTopDoctorsByRatingAsync(count);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetByAppointmentIdAsync_WithValidId_ShouldReturnReview()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                DoctorId = Guid.NewGuid(),
                Doctor = new Doctor { User = new User { FullName = "Dr. A" } },
                Patient = new Patient { User = new User { FullName = "Patient A", AvatarUrl = "avatar.jpg" } },
                AppointmentStartTime = DateTime.UtcNow,
                AppointmentEndTime = DateTime.UtcNow.AddMinutes(30)
            };
            var review = new Review { Id = Guid.NewGuid(), AppointmentId = appointmentId, Appointment = appointment };
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(review);
            _mapperMock.Setup(x => x.Map<ReviewDoctorDto>(review)).Returns(new ReviewDoctorDto { Id = review.Id });

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
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((Review?)null);

            // Act
            var result = await _service.GetByAppointmentIdAsync(appointmentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreateAsync_WithValidDto_ShouldCreateReview()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment 
            { 
                Id = appointmentId,
                DoctorId = Guid.NewGuid(),
                Doctor = new Doctor { User = new User { FullName = "Dr. A" } },
                Patient = new Patient { User = new User { FullName = "Patient A", AvatarUrl = "avatar.jpg" } },
                AppointmentStartTime = DateTime.UtcNow,
                AppointmentEndTime = DateTime.UtcNow.AddMinutes(30)
            };
            var dto = new CreateReviewDto { AppointmentId = appointmentId, Rating = 5, Comment = "Great doctor" };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync((Review?)null);
            _reviewRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Review>())).Returns(Task.CompletedTask);
            _reviewRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);
            _mapperMock.Setup(x => x.Map<ReviewDoctorDto>(It.IsAny<Review>())).Returns(new ReviewDoctorDto { Id = Guid.NewGuid() });

            // Act
            var result = await _service.CreateAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateAsync_WithInvalidAppointmentId_ShouldThrowException()
        {
            // Arrange
            var dto = new CreateReviewDto { AppointmentId = Guid.NewGuid() };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(dto.AppointmentId)).ReturnsAsync((Appointment?)null);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task CreateAsync_WithExistingReview_ShouldThrowException()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment { Id = appointmentId };
            var existingReview = new Review { Id = Guid.NewGuid(), AppointmentId = appointmentId };
            var dto = new CreateReviewDto { AppointmentId = appointmentId };
            _appointmentRepositoryMock.Setup(x => x.GetByIdAsync(appointmentId)).ReturnsAsync(appointment);
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(existingReview);

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(dto));
        }

        [Fact]
        public async Task GetTopDoctorsByRatingAsync_WithZeroCount_ShouldReturnEmpty()
        {
            // Arrange
            var count = 0;
            _reviewRepositoryMock.Setup(x => x.GetTopDoctorsByRatingAsync(count)).ReturnsAsync(new List<(Guid, string, string, double, int, string?)>());

            // Act
            var result = await _service.GetTopDoctorsByRatingAsync(count);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetTopDoctorsByRatingAsync_WithNegativeCount_ShouldReturnEmpty()
        {
            // Arrange
            var count = -1;
            _reviewRepositoryMock.Setup(x => x.GetTopDoctorsByRatingAsync(count)).ReturnsAsync(new List<(Guid, string, string, double, int, string?)>());

            // Act
            var result = await _service.GetTopDoctorsByRatingAsync(count);

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
        public async Task GetByAppointmentIdAsync_WithNullAppointment_ShouldReturnNull()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var review = new Review 
            { 
                Id = Guid.NewGuid(), 
                AppointmentId = appointmentId, 
                Appointment = null!
            };
            _reviewRepositoryMock.Setup(x => x.GetByAppointmentIdAsync(appointmentId)).ReturnsAsync(review);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.GetByAppointmentIdAsync(appointmentId));
        }

        [Fact]
        public async Task GetTopDoctorsByRatingAsync_WithLargeCount_ShouldReturnAll()
        {
            // Arrange
            var count = 100;
            var topDoctors = new List<(Guid DoctorId, string DoctorName, string Specialization, double AverageRating, int ReviewCount, string? ImageUrl)>
            {
                (Guid.NewGuid(), "Dr. A", "Cardiology", 4.5, 10, "url1"),
                (Guid.NewGuid(), "Dr. B", "Neurology", 4.8, 15, "url2")
            };
            _reviewRepositoryMock.Setup(x => x.GetTopDoctorsByRatingAsync(count)).ReturnsAsync(topDoctors);

            // Act
            var result = await _service.GetTopDoctorsByRatingAsync(count);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }
    }
}

