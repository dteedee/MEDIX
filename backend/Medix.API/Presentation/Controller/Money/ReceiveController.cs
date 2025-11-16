using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.NewFolder;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.PayOSDto;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using System.Runtime.InteropServices;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Medix.API.Presentation.Controller.Money
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiveController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly PayOSClient _client;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWalletTransactionService transactionService;
        private readonly IWalletService walletService;
        private readonly IUserRoleRepository userRoleRepository;

        private readonly IConfiguration _configuration;
        public ReceiveController([FromKeyedServices("OrderClient")] PayOSClient client, IWalletService walletService, IWalletTransactionService transactionService, IHttpContextAccessor httpContextAccessor, IUserService userService, IConfiguration configuration, IUserRoleRepository userRoleRepository)
        {
            _client = client;
            this.walletService = walletService;
            this.transactionService = transactionService;
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _configuration = configuration;
            this.userRoleRepository = userRoleRepository;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> Get(int id)
        {
            var order = OrderService.GetOrderById(id);
            if (order == null || string.IsNullOrEmpty(order.PaymentLinkId))
            {
                return NotFound();
            }

            try
            {
                var paymentLink = await _client.PaymentRequests.GetAsync(order.PaymentLinkId);

                order.Status = paymentLink.Status;
                order.Amount = paymentLink.Amount;
                order.AmountPaid = paymentLink.AmountPaid;
                order.AmountRemaining = paymentLink.AmountRemaining;
                order.CreatedAt = DateTimeOffset.TryParse(paymentLink.CreatedAt, out var createdAt) ? createdAt : null;
                order.CanceledAt = DateTimeOffset.TryParse(paymentLink.CanceledAt, out var canceledAt) ? canceledAt : null;
                order.CancellationReason = paymentLink.CancellationReason;

                if (paymentLink.Transactions != null && paymentLink.Transactions.Count > 0)
                {
                    OrderTransactionService.DeleteTransactionsByOrderId(order.Id);

                    var transactions = paymentLink.Transactions.Select(t => new OrderTransaction
                    {
                        OrderId = order.Id,
                        OrderCode = order.OrderCode,
                        PaymentLinkId = order.PaymentLinkId,
                        Reference = t.Reference,
                        Amount = t.Amount,
                        AccountNumber = t.AccountNumber,
                        Description = t.Description,
                        TransactionDateTime = DateTimeOffset.TryParse(t.TransactionDateTime, out var transactionDateTime) ? transactionDateTime : DateTimeOffset.Now,
                        VirtualAccountName = t.VirtualAccountName,
                        VirtualAccountNumber = t.VirtualAccountNumber,
                        CounterAccountBankId = t.CounterAccountBankId,
                        CounterAccountBankName = t.CounterAccountBankName,
                        CounterAccountName = t.CounterAccountName,
                        CounterAccountNumber = t.CounterAccountNumber
                    }).ToList();

                    OrderTransactionService.CreateTransactions(transactions);
                    order.LastTransactionUpdate = DateTimeOffset.Now;
                }

                OrderService.UpdateOrder(order.Id, order);
                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Failed to retrieve order {id}", error = ex.Message });
            }

        }

        [HttpPost("create-payment")]
        [Authorize]
        public async Task<ActionResult<Order>> CreatePayment(OrderCreateRequest request)
        {
            if (request == null)
            {
                return BadRequest("Order data is required");
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

            var userInfo = await _userService.GetUserBasicInfo(userId);
            if (userInfo == null)
                return NotFound(new { message = "User not found" });



            var orderCode = DateTimeOffset.Now.ToUnixTimeSeconds();
            var backendBaseUrl = $"{Request.Scheme}://{Request.Host}";
            var returnUrl = request.ReturnUrl ?? $"{backendBaseUrl}/api/Receive/payment-success";
            //var returnUrl = "https://www.youtube.com/";
            var cancelUrl = request.CancelUrl ?? $"{backendBaseUrl}/api/Receive/payment-failed";

            var wallet = await walletService.GetWalletByUserIdAsync(userId);
            List<PaymentLinkItem> items = new List<PaymentLinkItem>();
            var item = new PaymentLinkItem
            {
                Name = "Payment for order " + orderCode,
                Quantity = 1,
                Price = request.TotalAmount,
                Unit = "Vnd",
                TaxPercentage = 0


            };

            items.Add(item);
            var WalletTransactionDto = new WalletTransactionDto
            {
                Amount = request.TotalAmount,
                Description = "Payment for order " + orderCode,
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                TransactionTypeCode = "Deposit",
                orderCode = orderCode,
                Status = "Pending",
                BalanceAfter = wallet.Balance,
                BalanceBefore = wallet.Balance + Decimal.Parse(request.TotalAmount.ToString()),
                walletId = wallet.Id
            };

            await transactionService.createWalletTransactionAsync(WalletTransactionDto);


            var paymentRequest = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = request.TotalAmount,
                Description = request.Description ?? $"order {orderCode}",
                ReturnUrl = returnUrl,
                CancelUrl = cancelUrl,
                BuyerName = request.BuyerName,
                BuyerCompanyName = "Medix",
                BuyerEmail = userInfo.Email,
                BuyerPhone = userInfo.PhoneNumber,
                BuyerAddress = userInfo.address,
                ExpiredAt = DateTimeOffset.Now.AddMinutes(10).ToUnixTimeSeconds(),
                Items = items
            };

            if (request.BuyerNotGetInvoice.HasValue || request.TaxPercentage.HasValue)
            {
                paymentRequest.Invoice = new InvoiceRequest
                {
                    BuyerNotGetInvoice = request.BuyerNotGetInvoice,
                    TaxPercentage = request.TaxPercentage
                };
            }

            try
            {
                var paymentResponse = await _client.PaymentRequests.CreateAsync(paymentRequest);

                var order = new Order
                {
                    Id = 0, // Will be set by service
                    OrderCode = orderCode,
                    TotalAmount = request.TotalAmount,
                    Description = paymentResponse.Description,
                    PaymentLinkId = paymentResponse.PaymentLinkId,
                    QrCode = paymentResponse.QrCode,
                    CheckoutUrl = paymentResponse.CheckoutUrl,
                    Status = paymentResponse.Status,
                    Amount = paymentResponse.Amount,
                    AmountPaid = 0,
                    AmountRemaining = paymentResponse.Amount,
                    Bin = paymentResponse.Bin,
                    AccountNumber = paymentResponse.AccountNumber,
                    AccountName = paymentResponse.AccountName,
                    Currency = paymentResponse.Currency,
                    ReturnUrl = returnUrl,
                    CancelUrl = cancelUrl,
                    CreatedAt = DateTimeOffset.Now,
                    BuyerName = request.BuyerName,
                    BuyerCompanyName = request.BuyerCompanyName,
                    BuyerEmail = request.BuyerEmail,
                    BuyerPhone = request.BuyerPhone,
                    BuyerAddress = request.BuyerAddress,
                    ExpiredAt = request.ExpiredAt,
                    BuyerNotGetInvoice = request.BuyerNotGetInvoice,
                    TaxPercentage = request.TaxPercentage,
                    baseURLFE = request.baseURLFE,
                    Items = [.. items.Select(i => new OrderItem
                {
                    Name = i.Name,
                    Quantity = i.Quantity,
                    Price = i.Price,
                    Unit = i.Unit,
                    TaxPercentage = i.TaxPercentage
                })]
                };

                OrderService.CreateOrder(order);
                return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to create order", error = ex.Message });
            }
        }

        [HttpGet("payment-failed")]

        public async Task<IActionResult> paymentfailed([FromQuery] PaymentReturnDto paymentReturnDto)
        {
        
            var order = OrderService.GetOrderByOrderCode(paymentReturnDto.OrderCode);

            var frontendBaseUrl = order.baseURLFE ?? "http://localhost:5173";
            var walletTransaction = await transactionService.GetWalletTransactionByOrderCodeAsync(paymentReturnDto.OrderCode);

            walletTransaction.Status = "Failed";

            await transactionService.UppdateWalletTrasactionAsync(walletTransaction);

            var userInfo = await userRoleRepository.GetByIdAsync(walletService.GetWalletByIdAsync((Guid)walletTransaction.walletId).Result.UserId);
            if (userInfo.RoleCode == "Doctor")
            {
                return Redirect($"{frontendBaseUrl}/app/doctor/wallet");
            }

            return Redirect($"{frontendBaseUrl}/app/patient/finance");
        }

        private static DateTimeOffset ParseWebhookDateTime(string dateTimeString)
        {
            // Try to parse the standard ISO format first (2025-10-10T11:13:30+07:00)
            if (DateTimeOffset.TryParse(dateTimeString, out var result))
            {
                return result;
            }

            // Handle webhook format (2023-02-04 18:25:00)
            if (DateTime.TryParseExact(dateTimeString, "yyyy-MM-dd HH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var dateTime))
            {
                return new DateTimeOffset(dateTime, TimeSpan.FromHours(7));
            }

            // Fallback to current time if parsing fails    
            return DateTimeOffset.Now;
        }


        [HttpGet("payment-success")]
     
        public async Task<IActionResult> paymentSuccess([FromQuery] PaymentReturnDto paymentReturnDto)
        {
     

            if (paymentReturnDto.Status != "PAID")
            {

                return BadRequest(new { message = "Payment was not successfull" });
            }
            var order = OrderService.GetOrderByOrderCode(paymentReturnDto.OrderCode);

            var frontendBaseUrl = order.baseURLFE ?? "http://localhost:5173";
            var walletTransaction = await transactionService.GetWalletTransactionByOrderCodeAsync(paymentReturnDto.OrderCode);

            if (walletTransaction == null)
            {
                return BadRequest(new { message = "Wallet transaction not found for the given order code" });
            }
            walletTransaction.Status = "Completed";

          await  transactionService.UppdateWalletTrasactionAsync(walletTransaction);

            var wallet = walletService.GetWalletByIdAsync((Guid)walletTransaction.walletId).Result;
            if (wallet == null)
            {
                return BadRequest(new { message = "Wallet not found for the transaction" });
            }
            wallet.Balance += walletTransaction.Amount ?? 0;
            await walletService.IncreaseWalletBalanceAsync(wallet.UserId, walletTransaction.Amount ?? 0);


            var userInfo = await userRoleRepository.GetByIdAsync(wallet.UserId);

            if (userInfo.RoleCode == "Doctor")
            {
                return Redirect($"{frontendBaseUrl}/app/doctor/wallet");
            }

            return Redirect($"{frontendBaseUrl}/app/patient/finance");


        }


        [HttpPost("payment-webhook")]

        public async Task<ActionResult> VerifyPayment(Webhook webhook)
        {
            if (webhook == null)
            {
                return BadRequest("Webhook data is required");
            }

            try
            {
                var webhookData = await _client.Webhooks.VerifyAsync(webhook);
                if (webhookData.OrderCode == 123 && webhookData.Description == "VQRIO123" && webhookData.AccountNumber == "12345678")
                {
                    return Ok(new { message = "Webhook processed successfully" });
                }

                var order = OrderService.GetOrderByOrderCode(webhookData.OrderCode);
                if (order != null)
                {
                    var existingTransactions = OrderTransactionService.GetTransactionsByOrderId(order.Id);
                    var transactionExists = existingTransactions.Any(t => t.Reference == webhookData.Reference);

                    if (!transactionExists)
                    {
                        var transaction = new OrderTransaction
                        {
                            OrderId = order.Id,
                            OrderCode = order.OrderCode,
                            PaymentLinkId = order.PaymentLinkId ?? "",
                            Reference = webhookData.Reference,
                            Amount = webhookData.Amount,
                            AccountNumber = webhookData.AccountNumber,
                            Description = webhookData.Description,
                            TransactionDateTime = ParseWebhookDateTime(webhookData.TransactionDateTime),
                            VirtualAccountName = webhookData.VirtualAccountName,
                            VirtualAccountNumber = webhookData.VirtualAccountNumber,
                            CounterAccountBankId = webhookData.CounterAccountBankId,
                            CounterAccountBankName = webhookData.CounterAccountBankName,
                            CounterAccountName = webhookData.CounterAccountName,
                            CounterAccountNumber = webhookData.CounterAccountNumber
                        };

                        OrderTransactionService.CreateTransaction(transaction);
                    }

                    var allTransactions = OrderTransactionService.GetTransactionsByOrderId(order.Id);
                    var totalAmountPaid = allTransactions.Sum(t => t.Amount);

                    order.AmountPaid = totalAmountPaid;
                    order.AmountRemaining = order.Amount - totalAmountPaid;
                    order.Status = order.AmountRemaining > 0 ? PaymentLinkStatus.Underpaid : PaymentLinkStatus.Paid;
                    order.LastTransactionUpdate = DateTimeOffset.Now;

                    OrderService.UpdateOrder(order.Id, order);
                }

                return Ok(new { message = "Webhook processed successfully", orderCode = webhookData.OrderCode });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook processing error: {ex.Message}");
                return Problem(ex.Message);
            }
        }


    }
}




