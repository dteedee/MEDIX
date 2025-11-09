using Medix.API.Business.Interfaces.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Money
{
    [Route("api/[controller]")]
    [ApiController]
    public class WalletTransactionController : ControllerBase
    {
        private readonly IWalletTransactionService _walletTransactionService;
        private  readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;
        private readonly IWalletService _walletService;

        public WalletTransactionController(IWalletTransactionService walletTransactionService, IUserService userService, IHttpContextAccessor httpContextAccessor, IWalletService walletService)
        {
            _walletTransactionService = walletTransactionService;
            _userService = userService;
            _httpContextAccessor = httpContextAccessor;
            _walletService = walletService;
        }

        [HttpGet("getTransactionsByWalletId")]
        [Authorize]
        public async Task<IActionResult> GetTransactionsByWalletId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            if (wallet == null)
                return BadRequest(new { message = "User or wallet not found" });

            var transactions = await _walletTransactionService.GetTransactionsByWalletIdAsync(wallet.Id.Value);
            return Ok(transactions);
        }
    }
}
