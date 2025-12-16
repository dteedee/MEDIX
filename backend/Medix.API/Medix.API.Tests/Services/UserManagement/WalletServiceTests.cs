using Xunit;
using Moq;
using FluentAssertions;
using Medix.API.Business.Services.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;

namespace Medix.API.Tests.Services.UserManagement
{
    public class WalletServiceTests
    {
        private readonly Mock<IWalletRepository> _repositoryMock;
        private readonly WalletService _service;

        public WalletServiceTests()
        {
            _repositoryMock = new Mock<IWalletRepository>();
            _service = new WalletService(_repositoryMock.Object);
        }

        [Fact]
        public async Task CreateWalletAsync_WithValidDto_ShouldCreateWallet()
        {
            // Arrange
            var dto = new WalletDTo
            {
                UserId = Guid.NewGuid(),
                Balance = 0,
                Currency = "VND",
                IsActive = true
            };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = dto.UserId, Balance = dto.Balance };
            _repositoryMock.Setup(x => x.CreateWalletAsync(It.IsAny<Wallet>())).ReturnsAsync(wallet);

            // Act
            var result = await _service.CreateWalletAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(dto.UserId);
        }

        [Fact]
        public async Task GetWalletByIdAsync_WithValidId_ShouldReturnWallet()
        {
            // Arrange
            var walletId = Guid.NewGuid();
            var wallet = new Wallet { Id = walletId, Balance = 100000, Currency = "VND" };
            _repositoryMock.Setup(x => x.GetWalletByIdAsync(walletId)).ReturnsAsync(wallet);

            // Act
            var result = await _service.GetWalletByIdAsync(walletId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(walletId);
            result.Balance.Should().Be(100000);
        }

        [Fact]
        public async Task GetWalletByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var walletId = Guid.NewGuid();
            _repositoryMock.Setup(x => x.GetWalletByIdAsync(walletId)).ReturnsAsync((Wallet?)null);

            // Act
            var result = await _service.GetWalletByIdAsync(walletId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetWalletByUserIdAsync_WithValidUserId_ShouldReturnWallet()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 50000 };
            _repositoryMock.Setup(x => x.GetWalletByUserIdAsync(userId)).ReturnsAsync((Wallet?)wallet);

            // Act
            var result = await _service.GetWalletByUserIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.UserId.Should().Be(userId);
        }

        [Fact]
        public async Task GetWalletBalanceAsync_WithValidUserId_ShouldReturnBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var balance = 100000m;
            _repositoryMock.Setup(x => x.GetWalletBalanceAsync(userId)).ReturnsAsync(balance);

            // Act
            var result = await _service.GetWalletBalanceAsync(userId);

            // Assert
            result.Should().Be(balance);
        }

        [Fact]
        public async Task IncreaseWalletBalanceAsync_WithValidData_ShouldIncreaseBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = 50000m;
            _repositoryMock.Setup(x => x.IncreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(true);

            // Act
            var result = await _service.IncreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task DecreaseWalletBalanceAsync_WithValidData_ShouldDecreaseBalance()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = 30000m;
            _repositoryMock.Setup(x => x.DecreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(true);

            // Act
            var result = await _service.DecreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task CreateWalletAsync_WithNullDto_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.CreateWalletAsync(null!));
        }

        [Fact]
        public async Task GetWalletByIdAsync_WithEmptyId_ShouldReturnNull()
        {
            // Arrange
            var walletId = Guid.Empty;
            _repositoryMock.Setup(x => x.GetWalletByIdAsync(walletId)).ReturnsAsync((Wallet?)null);

            // Act
            var result = await _service.GetWalletByIdAsync(walletId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetWalletByUserIdAsync_WithEmptyUserId_ShouldThrowException()
        {
            // Arrange
            var userId = Guid.Empty;
            _repositoryMock.Setup(x => x.GetWalletByUserIdAsync(userId)).ReturnsAsync((Wallet?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.GetWalletByUserIdAsync(userId));
        }

        [Fact]
        public async Task GetWalletBalanceAsync_WithEmptyUserId_ShouldReturnZero()
        {
            // Arrange
            var userId = Guid.Empty;
            _repositoryMock.Setup(x => x.GetWalletBalanceAsync(userId)).ReturnsAsync(0m);

            // Act
            var result = await _service.GetWalletBalanceAsync(userId);

            // Assert
            result.Should().Be(0);
        }

        [Fact]
        public async Task IncreaseWalletBalanceAsync_WithZeroAmount_ShouldReturnTrue()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = 0m;
            _repositoryMock.Setup(x => x.IncreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(true);

            // Act
            var result = await _service.IncreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task DecreaseWalletBalanceAsync_WithZeroAmount_ShouldReturnTrue()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = 0m;
            _repositoryMock.Setup(x => x.DecreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(true);

            // Act
            var result = await _service.DecreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task IncreaseWalletBalanceAsync_WithNegativeAmount_ShouldReturnFalse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = -1000m;
            _repositoryMock.Setup(x => x.IncreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(false);

            // Act
            var result = await _service.IncreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task DecreaseWalletBalanceAsync_WithNegativeAmount_ShouldReturnFalse()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var amount = -1000m;
            _repositoryMock.Setup(x => x.DecreaseWalletBalanceAsync(userId, amount)).ReturnsAsync(false);

            // Act
            var result = await _service.DecreaseWalletBalanceAsync(userId, amount);

            // Assert
            result.Should().BeFalse();
        }
    }
}

