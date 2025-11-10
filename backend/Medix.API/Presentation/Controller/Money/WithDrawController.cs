using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.NewFolder;
using Medix.API.Models.DTOs.PayOSDto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models.V1.Payouts;
using System.Security.Cryptography.Xml;

namespace Medix.API.Presentation.Controller.Money
{
    [Route("api/[controller]")]
    [ApiController]
    public class WithDrawController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IWalletTransactionService _walletTransactionService;
        private readonly PayOSClient _client;

        public WithDrawController(IWalletService walletService, IHttpContextAccessor httpContextAccessor, IUserService userService, IWalletTransactionService walletTransactionService, [FromKeyedServices("TransferClient")] PayOSClient client)
        {
            _walletService = walletService;
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _walletTransactionService = walletTransactionService;
            _client = client;
        }





        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<Transfer>> Get(string id)
        {
            try
            {
                var transfer = TransferService.GetTransferById(id);
                Payout payout;
                if (transfer == null)
                {
                    return NotFound();
                }
                if (string.IsNullOrEmpty(transfer.PayoutId))
                {
                    var payoutPage = await _client.Payouts.ListAsync(new GetPayoutListParam { ReferenceId = id });
                    if (payoutPage.Data.Count == 0)
                    {
                        return NotFound();
                    }
                    payout = payoutPage.Data[0]; // TODO: Handle case where multiple payouts exist with the same referenceId. Currently selecting the first one; consider filtering by status or date for accuracy.
                }
                else
                {
                    payout = await _client.Payouts.GetAsync(transfer.PayoutId);
                }
                TransferService.UpdateTransfer(id, MapPayoutToTransfer(payout));
                return Ok(transfer);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Failed to retrieve transfer", error = ex.Message });
            }
        }

    


    
        [HttpPost("transfer")]
        [Authorize]
        public async Task<ActionResult<Transfer>> CreateTransfer([FromBody] TransferCreateRequest request)
        {
            if (request == null)
            {
                return BadRequest("Transfer data is required");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var payoutRequest = new PayoutRequest
            {
                ReferenceId = Guid.NewGuid().ToString(),
                Amount = request.Amount,
                Description = request.Description,
                ToBin = request.ToBin,
                ToAccountNumber = request.ToAccountNumber,
                Category = request.Category
            };

            try
            {
                var payoutResponse = await _client.Payouts.CreateAsync(payoutRequest);

                var transfer = MapPayoutToTransfer(payoutResponse);

                TransferService.CreateTransfer(transfer);

                return CreatedAtAction(nameof(Get), new { id = transfer.Id }, transfer);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Failed to create payout", error = ex.Message });
            }
        }

        private static Transfer MapPayoutToTransfer(Payout payout)
        {
            return new Transfer
            {
                Id = payout.ReferenceId,
                PayoutId = payout.Id,
                Category = payout.Category,
                ApprovalState = payout.ApprovalState,
                CreatedAt = DateTimeOffset.TryParse(payout.CreatedAt, out var createdAt) ? createdAt : DateTimeOffset.Now,
                Transactions = [.. payout.Transactions.Select(MapPayoutTransactionToTransferTransaction)]
            };
        }

        private static TransferTransactionDToAccountRequest MapPayoutTransactionToTransferTransaction(PayoutTransaction transaction)
        {
            return new TransferTransactionDToAccountRequest
            {
                Id = transaction.ReferenceId,
                PayoutTransactionId = transaction.Id,
                Amount = transaction.Amount,
                Description = transaction.Description,
                ToBin = transaction.ToBin,
                ToAccountNumber = transaction.ToAccountNumber,
                ToAccountName = transaction.ToAccountName,
                Reference = transaction.Reference,
                TransactionDatetime = DateTimeOffset.TryParse(transaction.TransactionDatetime, out var transactionDatetime) ? transactionDatetime : null,
                ErrorMessage = transaction.ErrorMessage,
                ErrorCode = transaction.ErrorCode,
                State = transaction.State
            };
        }
    } 

}
