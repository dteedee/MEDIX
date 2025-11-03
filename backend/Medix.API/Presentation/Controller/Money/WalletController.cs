using Medix.API.Business.Interfaces.UserManagement;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Money
{
    [Route("api/[controller]")]
    [ApiController]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        [HttpGet("getWallet")]
        public async Task<IActionResult> GetWalletByUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            if (wallet == null)
            {
                return NotFound();
            }
            return Ok(wallet);
        }
    }
}
