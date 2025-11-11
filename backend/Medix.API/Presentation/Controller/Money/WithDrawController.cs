using Humanizer;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.NewFolder;
using Medix.API.Models.DTOs.PayOSDto;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models.V1.Payouts;
using System.Security.Claims;
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
        private readonly ITransferTransactionService _transferTransactionService; 
        private readonly PayOSClient _client;

        public WithDrawController(IWalletService walletService, IHttpContextAccessor httpContextAccessor, IUserService userService, IWalletTransactionService walletTransactionService, [FromKeyedServices("TransferClient")] PayOSClient client, ITransferTransactionService transferTransactionService)
        {
            _walletService = walletService;
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _walletTransactionService = walletTransactionService;
            _client = client;
            _transferTransactionService = transferTransactionService;
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

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });
           
           var transferTransaction = await _transferTransactionService.GetTransferTransactionByIdAsync(request.TransferTransactionID);

            if (transferTransaction.Status == "Rejected")
            {
                return BadRequest(new
                {
                    message = $"Cannot reject transfer with status: {transferTransaction.Status}",
                    currentStatus = transferTransaction.Status
                });
            }

            if (transferTransaction.Status == "Accepted")
            {
                return BadRequest(new
                {
                    message = $"Cannot Accepted transfer with status: {transferTransaction.Status}",
                    currentStatus = transferTransaction.Status
                });
            }
            if (transferTransaction == null)
            {
                return NotFound(new { message = "Transfer transaction not found" });
            } 

                var wallettransaction = await _walletTransactionService.GetWalletTransactionByIdAsync(transferTransaction.WalletTransactionID);

            if (wallettransaction == null)
            {
                return NotFound(new { message = "Wallet transaction not found" });
            }

            var wallet = await _walletService.GetWalletByIdAsync((Guid)wallettransaction.walletId);

            if (wallet == null)
            {
                return NotFound(new { message = "Wallet not found" });
            }

            var payoutRequest = new PayoutRequest
            {
                ReferenceId = Guid.NewGuid().ToString(),
                Amount = transferTransaction.Amount,
                Description = transferTransaction.Description,
                ToBin = transferTransaction.ToBin,
                ToAccountNumber = transferTransaction.ToAccountNumber,
                Category = new List<string> { "bank_transfer"}
            };

            try
            {
                var payoutResponse = await _client.Payouts.CreateAsync(payoutRequest);

                var transfer = MapPayoutToTransfer(payoutResponse);

                TransferService.CreateTransfer(transfer);
                wallettransaction.Status = "Completed";

                await _walletTransactionService.UppdateWalletTrasactionAsync(wallettransaction);


                await _walletService.DecreaseWalletBalanceAsync(wallet.UserId, transferTransaction.Amount);


                transferTransaction.Status = "Accepted";
                await _transferTransactionService.UpdateTransferTransactionAsync(transferTransaction);



                return CreatedAtAction(nameof(Get), new { id = transfer.Id }, transfer);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Failed to create payout", error = ex.Message });
            }
        }

     [HttpPost("transfer-Reject")]
[Authorize]
public async Task<ActionResult> RejectedTransfer([FromBody] TransferCreateRequest request)
{
    if (request == null)
    {
        return BadRequest("Transfer data is required");
    }
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
    if (userIdClaim == null)
        return Unauthorized(new { message = "User ID not found in token" });

    if (!Guid.TryParse(userIdClaim.Value, out var userId))
        return Unauthorized(new { message = "Invalid user ID in token" });

    var transferTransaction = await _transferTransactionService.GetTransferTransactionByIdAsync(request.TransferTransactionID);

    if (transferTransaction == null)
    {
        return NotFound(new { message = "Transfer transaction not found" });
    }

    // ✅ Kiểm tra quyền sở hữu
    if (transferTransaction.UserId != userId)
    {
        return Forbid(); // Hoặc return Unauthorized(new { message = "You don't have permission to reject this transfer" });
    }

    // ✅ Kiểm tra status - chỉ có thể reject khi đang Pending
    if (transferTransaction.Status != "Pending")
    {
        return BadRequest(new 
        { 
            message = $"Cannot reject transfer with status: {transferTransaction.Status}",
            currentStatus = transferTransaction.Status
        });
    }

    var wallettransaction = await _walletTransactionService.GetWalletTransactionByIdAsync(transferTransaction.WalletTransactionID);

    if (wallettransaction == null)
    {
        return NotFound(new { message = "Wallet transaction not found" });
    }

    var wallet = await _walletService.GetWalletByIdAsync((Guid)wallettransaction.walletId);

    if (wallet == null)
    {
        return NotFound(new { message = "Wallet not found" });
    }

    try
    {
        // ✅ Sửa: WalletTransaction status thành "Failed" thay vì "Completed"
        wallettransaction.Status = "Failed";
        wallettransaction.Description += "Bị từ chối";
        
        await _walletTransactionService.UppdateWalletTrasactionAsync(wallettransaction);

        // ✅ Cập nhật TransferTransaction status thành "Rejected"
        transferTransaction.Status = "Rejected";
        transferTransaction.Description += "Bị từ chối";
        
        await _transferTransactionService.UpdateTransferTransactionAsync(transferTransaction);

        // ✅ Sửa: Thêm dấu chấm phẩy và trả về thông tin chi tiết
        return Ok(new 
        { 
            message = "Transfer rejected successfully",
            transferTransactionId = transferTransaction.Id,
            status = transferTransaction.Status,
            rejectedAt = DateTime.UtcNow
        }); // ✅ Đã thêm dấu ;
    }
    catch (Exception ex)
    {
        return StatusCode(StatusCodes.Status500InternalServerError,
            new { message = "Failed to reject transfer", error = ex.Message });
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
