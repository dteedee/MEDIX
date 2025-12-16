using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;
using Medix.API.Models.Entities;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace Medix.API.Tests.Services.Classification
{
    public class PromotionServiceTests
    {
        private readonly Mock<ILogger<PromotionService>> _loggerMock;
        private readonly Mock<IPromotionRepository> _repositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly PromotionService _service;

        public PromotionServiceTests()
        {
            _loggerMock = new Mock<ILogger<PromotionService>>();
            _repositoryMock = new Mock<IPromotionRepository>();
            _mapperMock = new Mock<IMapper>();
            _service = new PromotionService(_loggerMock.Object, _repositoryMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task GetAllPromotion_ShouldReturnAllPromotions()
        {
            // Arrange
            var promotions = new List<Promotion>
            {
                new Promotion { Id = Guid.NewGuid(), Code = "PROMO1", IsActive = true }
            };
            _repositoryMock.Setup(x => x.getAllPromotion()).ReturnsAsync(promotions);
            _mapperMock.Setup(x => x.Map<IEnumerable<PromotionDto>>(It.IsAny<IEnumerable<Promotion>>()))
                .Returns(promotions.Select(p => new PromotionDto { Id = p.Id, Code = p.Code }));

            // Act
            var result = await _service.GetAllPromotion();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetAllPromotion_WithNullResult_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.getAllPromotion()).ReturnsAsync((IEnumerable<Promotion>?)null);

            // Act
            var result = await _service.GetAllPromotion();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPromotionByCodeAsync_WithValidCode_ShouldReturnPromotion()
        {
            // Arrange
            var code = "PROMO1";
            var promotion = new Promotion { Id = Guid.NewGuid(), Code = code };
            _repositoryMock.Setup(x => x.GetPromotionByCodeAsync(code)).ReturnsAsync(promotion);
            _mapperMock.Setup(x => x.Map<PromotionDto>(promotion))
                .Returns(new PromotionDto { Id = promotion.Id, Code = code });

            // Act
            var result = await _service.GetPromotionByCodeAsync(code);

            // Assert
            result.Should().NotBeNull();
            result!.Code.Should().Be(code);
        }

        [Fact]
        public async Task GetPromotionByCodeAsync_WithInvalidCode_ShouldReturnNull()
        {
            // Arrange
            var code = "INVALID";
            _repositoryMock.Setup(x => x.GetPromotionByCodeAsync(code)).ReturnsAsync((Promotion?)null);

            // Act
            var result = await _service.GetPromotionByCodeAsync(code);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreatePromotionAsync_WithValidDto_ShouldCreatePromotion()
        {
            // Arrange
            var dto = new PromotionDto
            {
                Code = "NEWPROMO",
                DiscountValue = 50000,
                DiscountType = "Fixed",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30)
            };
            var promotion = new Promotion { Id = Guid.NewGuid(), Code = dto.Code };
            _mapperMock.Setup(x => x.Map<Promotion>(dto)).Returns(promotion);
            _repositoryMock.Setup(x => x.createPromotionAsync(It.IsAny<Promotion>())).ReturnsAsync(promotion);
            _mapperMock.Setup(x => x.Map<PromotionDto>(promotion)).Returns(dto);

            // Act
            var result = await _service.CreatePromotionAsync(dto);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task CreatePromotionAsync_WithException_ShouldReturnNull()
        {
            // Arrange
            var dto = new PromotionDto { Code = "PROMO" };
            _mapperMock.Setup(x => x.Map<Promotion>(dto)).Throws(new Exception("Error"));

            // Act
            var result = await _service.CreatePromotionAsync(dto);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetAllPromotion_WithEmptyList_ShouldReturnEmpty()
        {
            // Arrange
            _repositoryMock.Setup(x => x.getAllPromotion()).ReturnsAsync(new List<Promotion>());
            _mapperMock.Setup(x => x.Map<IEnumerable<PromotionDto>>(It.IsAny<IEnumerable<Promotion>>()))
                .Returns(new List<PromotionDto>());

            // Act
            var result = await _service.GetAllPromotion();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPromotionByCodeAsync_WithEmptyCode_ShouldReturnNull()
        {
            // Arrange
            var code = "";
            _repositoryMock.Setup(x => x.GetPromotionByCodeAsync(code)).ReturnsAsync((Promotion?)null);

            // Act
            var result = await _service.GetPromotionByCodeAsync(code);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreatePromotionAsync_WithNullDto_ShouldReturnNull()
        {
            // Act
            var result = await _service.CreatePromotionAsync(null!);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task CreatePromotionAsync_WithInvalidDates_ShouldReturnNull()
        {
            // Arrange
            var dto = new PromotionDto
            {
                Code = "PROMO",
                StartDate = DateTime.UtcNow.AddDays(30),
                EndDate = DateTime.UtcNow
            };
            _mapperMock.Setup(x => x.Map<Promotion>(dto)).Throws(new Exception("Invalid dates"));

            // Act
            var result = await _service.CreatePromotionAsync(dto);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetAllPromotion_WithMultiplePromotions_ShouldReturnAll()
        {
            // Arrange
            var promotions = new List<Promotion>
            {
                new Promotion { Id = Guid.NewGuid(), Code = "PROMO1", IsActive = true },
                new Promotion { Id = Guid.NewGuid(), Code = "PROMO2", IsActive = false },
                new Promotion { Id = Guid.NewGuid(), Code = "PROMO3", IsActive = true }
            };
            _repositoryMock.Setup(x => x.getAllPromotion()).ReturnsAsync(promotions);
            _mapperMock.Setup(x => x.Map<IEnumerable<PromotionDto>>(It.IsAny<IEnumerable<Promotion>>()))
                .Returns(promotions.Select(p => new PromotionDto { Id = p.Id, Code = p.Code }));

            // Act
            var result = await _service.GetAllPromotion();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }
    }
}

