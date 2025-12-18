using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Interfaces.Classification;
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
        private readonly IDoctorService _doctorService;

        public WalletController(IWalletService walletService, IDoctorService doctorService)
        {
            _walletService = walletService;
            _doctorService = doctorService;
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

        [HttpGet("doctor-fee")]
        public async Task<IActionResult> GetDoctorFeeAndCommission()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
                return Unauthorized(new { message = "User ID not found in token" });

            if (!Guid.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new { message = "Invalid user ID in token" });

            var doctor = await _doctorService.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                return NotFound(new { message = "Doctor not found for this user" });

            return Ok(new
            {
                consultationFee = doctor.ConsultationFee,
                commissionRate = doctor.CommissionRate
            });
        }

    }
}
