using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs.PayOSDto;
using Medix.API.Models.DTOs.Wallet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransferTransactionController : ControllerBase
    {
        private readonly ITransferTransactionService _transferTransactionService;

        private readonly IWalletTransactionService walletTransactionService;
        private readonly IWalletService walletService;



        public TransferTransactionController(ITransferTransactionService transferTransactionService, IWalletTransactionService walletTransactionService, IWalletService walletService)
        {
            _transferTransactionService = transferTransactionService;
            this.walletTransactionService = walletTransactionService;
            this.walletService = walletService;
        }

        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> CreateTransferTransaction([FromBody] TransferTransactionCreateRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request body is null.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });
            request.UserId = userId;

            var wallet = await walletService.GetWalletByUserIdAsync(userId);

            if (wallet == null)
            {
                return NotFound(new { message = "Wallet not found for the user" });
            }

            var trans = new WalletTransactionDto
            {
                walletId = wallet.Id,
                Amount = request.Amount,
                TransactionTypeCode = "Withdrawal",
                Description = request.Description,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                BalanceAfter = (wallet.Balance - (Decimal)request.Amount),
                BalanceBefore = wallet.Balance 

            };




            var transResult  = await walletTransactionService.createWalletTransactionAsync(trans);

            if (transResult == null || transResult.id == null)
            {
                return StatusCode(500, new { message = "Failed to create wallet transaction" });
            }
            request.WalletTransactionID = transResult.id;
            var result = await _transferTransactionService.CreateTransferTransactionAsync(request);
            return CreatedAtAction(nameof(GetTransferTransactionById), new { id = result.Id }, result);

        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransferTransactionById(Guid id)
        {
            var result = await _transferTransactionService.GetTransferTransactionByIdAsync(id);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }
    }
}
