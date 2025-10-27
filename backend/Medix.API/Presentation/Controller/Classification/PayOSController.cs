using API.Models.DTOs;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.PayOSDto;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Net.payOS;
using Net.payOS.Types;


namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayOSController : ControllerBase
    {
        private readonly PayOS _payOS;
        private readonly string _clientId;
        private readonly string _apiKey;
        private readonly string _checksumKey;
        public PayOSController(PayOS payOS, IConfiguration configuration)
        {
            _payOS = payOS;
            _clientId = configuration["Environment:PAYOS_CLIENT_ID"]
                 ?? throw new Exception("Cannot find PAYOS_CLIENT_ID in configuration");

            _apiKey = configuration["Environment:PAYOS_API_KEY"]
                      ?? throw new Exception("Cannot find PAYOS_API_KEY in configuration");

            _checksumKey = configuration["Environment:PAYOS_CHECKSUM_KEY"]
                           ?? throw new Exception("Cannot find PAYOS_CHECKSUM_KEY in configuration");
        }



        [HttpPost("create-payment-link")]
       
        public async Task<IActionResult> Create(ItemData item)
        {
        
           List<ItemData > items = new List<ItemData>();
            items.Add(item);
            var payOS = new PayOS(_clientId, _apiKey, _checksumKey);

            var domain = "http://localhost:5123";

            var paymentLinkRequest = new PaymentData(
                orderCode: int.Parse(DateTimeOffset.Now.ToString("ffffff")),
                amount: item.price,
                description: "Thanh toan don hang",
             items,
                returnUrl: domain + "?success=true",
                cancelUrl: domain + "?canceled=true"
            );
            var response = await payOS.createPaymentLink(paymentLinkRequest);
            return Ok(response.checkoutUrl);   
        }




        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrder([FromRoute] int orderId)
        {
            try
            {
                PaymentLinkInformation paymentLinkInformation = await _payOS.getPaymentLinkInformation(orderId);
                return Ok(new Response(0, "Ok", paymentLinkInformation));
            }
            catch (System.Exception exception)
            {

                Console.WriteLine(exception);
                return Ok(new Response(-1, "fail", null));
            }

        }
        [HttpPut("cancel/{orderId}")]
        public async Task<IActionResult> CancelOrder([FromRoute] int orderId)
        {
            try
            {
                PaymentLinkInformation paymentLinkInformation = await _payOS.cancelPaymentLink(orderId);
                return Ok(new Response(0, "Ok", paymentLinkInformation));
            }
            catch (System.Exception exception)
            {

                Console.WriteLine(exception);
                return Ok(new Response(-1, "fail", null));
            }

        }
        [HttpPost("confirm-webhook")]
        public async Task<IActionResult> ConfirmWebhook(ConfirmWebhook body)
        {
            try
            {
                await _payOS.confirmWebhook(body.webhook_url);
                return Ok(new Response(0, "Ok", null));
            }
            catch (System.Exception exception)
            {

                Console.WriteLine(exception);
                return Ok(new Response(-1, "fail", null));
            }

        }

    }
}
