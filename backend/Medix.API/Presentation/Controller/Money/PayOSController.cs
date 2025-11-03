//using API.Models.DTOs;
//using Medix.API.Business.Interfaces.UserManagement;
//using Medix.API.Business.Services.UserManagement;
//using Medix.API.Models.DTOs;
//using Medix.API.Models.DTOs.PayOSDto;
//using Medix.API.Models.DTOs.Wallet;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using Net.payOS;
//using Net.payOS.Types;
//using System.Security.Claims;


//namespace Medix.API.Presentation.Controller.Money
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class PayOSController : ControllerBase
//    {
//        private readonly PayOS _payOS;
//        private readonly string _clientId;
//        private readonly string _apiKey;
//        private readonly string _checksumKey;
//        private readonly IWalletTransactionService _walletTransactionService;
//        private readonly IWalletService _walletService;
//        public PayOSController(PayOS payOS, IConfiguration configuration, IWalletTransactionService walletTransactionService, IWalletService walletService)
//        {
//            _payOS = payOS;
//            _clientId = configuration["PayOS:ClientId"]
//                 ?? throw new Exception("Cannot find PAYOS_CLIENT_ID in configuration");

//            _apiKey = configuration["PayOS:ApiKey"]
//                      ?? throw new Exception("Cannot find PAYOS_API_KEY in configuration");

//            _checksumKey = configuration["PayOS:ChecksumKey"]
//                           ?? throw new Exception("Cannot find PAYOS_CHECKSUM_KEY in configuration");
//            _walletTransactionService = walletTransactionService;
//            _walletService = walletService;
//        }



//        [HttpPost("create-payment-link")]
//        [Authorize]
//        public async Task<IActionResult> Create([FromBody] ItemData item)
//        {
//            if (item == null)
//                return BadRequest(new { message = "Request body is required." });

//            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
//            if (userIdClaim == null)
//                return Unauthorized(new { message = "User ID not found in token" });

//            if (!Guid.TryParse(userIdClaim.Value, out var userId))
//                return Unauthorized(new { message = "Invalid user ID in token" });

//            var userWallet = await _walletService.GetWalletByUserIdAsync(userId);
//            if (userWallet == null)
//            {
//                return BadRequest(new { message = "User wallet not found" });
//            }

//            // Tạo order code 6 chữ số an toàn (millis % 1_000_000)
//            int orderCode = (int)(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1_000_000);

//            // Tạo Guid mới cho transaction Id (KHÔNG parse từ orderCode)
//            var newTransactionId = Guid.NewGuid();

//            // Nếu WalletTransactionDto.walletId kiểu Guid? hoặc Guid, gán trực tiếp userWallet.Id
//            WalletTransactionDto walletTransaction = new WalletTransactionDto
//            {
//                id = newTransactionId,
//                walletId = userWallet.Id,
//                Amount = item.price,
//                TransactionTypeCode = "AppointmentPayment",
//                Description = item.name,
//                Status = "Pending",
//                orderCode = orderCode,
//                TransactionDate = DateTime.UtcNow,
//                CreatedAt = DateTime.UtcNow
//            };

//            var result = await _walletTransactionService.createWalletTransactionAsync(walletTransaction);
//            if (result == null)
//            {
//                return BadRequest(new { message = "Failed to create wallet transaction" });
//            }

//            List<ItemData> items = new List<ItemData> { item };
//            var payOS = new PayOS(_clientId, _apiKey, _checksumKey);

//            var domain = "http://localhost:5123";

//            var paymentLinkRequest = new PaymentData(
//                orderCode,
//                amount: item.price,
//                description: "Thanh toan don hang",
//                items,
//                returnUrl: domain + "?success=true",
//                cancelUrl: domain + "?canceled=true"
//            );

//            var response = await payOS.createPaymentLink(paymentLinkRequest);
//            return Ok(response);
//        }




//        [HttpGet("{orderId}")]
//        public async Task<IActionResult> GetOrder([FromRoute] int orderId)
//        {
//            try
//            {
//                PaymentLinkInformation paymentLinkInformation = await _payOS.getPaymentLinkInformation(orderId);
//                return Ok(new Response(0, "Ok", paymentLinkInformation));
//            }
//            catch (Exception exception)
//            {

//                Console.WriteLine(exception);
//                return Ok(new Response(-1, "fail", null));
//            }

//        }
//        [HttpPut("cancel/{orderId}")]
//        public async Task<IActionResult> CancelOrder([FromRoute] int orderId)
//        {
//            try
//            {
//                PaymentLinkInformation paymentLinkInformation = await _payOS.cancelPaymentLink(orderId);
//                return Ok(new Response(0, "Ok", paymentLinkInformation));
//            }
//            catch (Exception exception)
//            {

//                Console.WriteLine(exception);
//                return Ok(new Response(-1, "fail", null));
//            }

//        }
//        [HttpPost("confirm-webhook")]
//        public async Task<IActionResult> ConfirmWebhook(ConfirmWebhook body)
//        {
//            try
//            {
//                await _payOS.confirmWebhook(body.webhook_url);
//                return Ok(new Response(0, "Ok", null));
//            }
//            catch (Exception exception)
//            {

//                Console.WriteLine(exception);
//                return Ok(new Response(-1, "fail", null));
//            }

//        }




//    }
//}
