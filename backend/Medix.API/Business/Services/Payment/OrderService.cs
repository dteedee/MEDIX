using Medix.API.Models.DTOs.PayOSDto;

namespace Medix.API.Business.Services.NewFolder
{
    public static class OrderService
    {
        private static readonly List<Order> Orders = [];

        public static List<Order> GetAllOrders()
        {
            return Orders;
        }

        public static Order? GetOrderById(int id)
        {
            return Orders.FirstOrDefault(o => o.Id == id);
        }

        public static Order? GetOrderByOrderCode(long orderCode)
        {
            return Orders.FirstOrDefault(o => o.OrderCode == orderCode);
        }

        public static Order? GetOrderByPaymentLinkId(string paymentLinkId)
        {
            return Orders.FirstOrDefault(o => o.PaymentLinkId == paymentLinkId);
        }

        public static void CreateOrder(Order order)
        {
            order.Id = Orders.Count + 1;
            Orders.Add(order);
        }

        public static bool UpdateOrder(int id, Order updatedOrder)
        {
            var order = Orders.FirstOrDefault(o => o.Id == id);
            if (order == null) return false;

            order.OrderCode = updatedOrder.OrderCode;
            order.TotalAmount = updatedOrder.TotalAmount;
            order.OrderDate = updatedOrder.OrderDate;
            order.Description = updatedOrder.Description;
            order.Items = updatedOrder.Items;

            order.PaymentLinkId = updatedOrder.PaymentLinkId;
            order.QrCode = updatedOrder.QrCode;
            order.CheckoutUrl = updatedOrder.CheckoutUrl;
            order.Status = updatedOrder.Status;

            order.Amount = updatedOrder.Amount;
            order.AmountPaid = updatedOrder.AmountPaid;
            order.AmountRemaining = updatedOrder.AmountRemaining;

            order.BuyerName = updatedOrder.BuyerName;
            order.BuyerCompanyName = updatedOrder.BuyerCompanyName;
            order.BuyerEmail = updatedOrder.BuyerEmail;
            order.BuyerPhone = updatedOrder.BuyerPhone;
            order.BuyerAddress = updatedOrder.BuyerAddress;

            order.Bin = updatedOrder.Bin;
            order.AccountNumber = updatedOrder.AccountNumber;
            order.AccountName = updatedOrder.AccountName;
            order.Currency = updatedOrder.Currency;

            order.ReturnUrl = updatedOrder.ReturnUrl;
            order.CancelUrl = updatedOrder.CancelUrl;

            order.CreatedAt = updatedOrder.CreatedAt;
            order.CanceledAt = updatedOrder.CanceledAt;
            order.ExpiredAt = updatedOrder.ExpiredAt;
            order.LastTransactionUpdate = updatedOrder.LastTransactionUpdate;

            order.CancellationReason = updatedOrder.CancellationReason;

            order.BuyerNotGetInvoice = updatedOrder.BuyerNotGetInvoice;
            order.TaxPercentage = updatedOrder.TaxPercentage;

            return true;
        }

        public static bool DeleteOrder(int id)
        {
            var order = Orders.FirstOrDefault(o => o.Id == id);
            if (order == null) return false;
            Orders.Remove(order);
            return true;
        }
    }
}
