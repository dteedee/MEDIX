namespace Medix.API.Models.Enums
{
    public record DiscountType(string Code, string Description)
    {
        public static readonly DiscountType Percentage = new("Percentage", "Giảm theo phần trăm");
        public static readonly DiscountType FixedAmount = new("FixedAmount", "Giảm theo số tiền cố định");


        public static IEnumerable<DiscountType> List() => new[]
        {
            Percentage, FixedAmount
        };

        public static DiscountType? FromCode(string code) =>
            List().FirstOrDefault(d => d.Code == code); // hàm lấy ra mã code 

        public static string? GetDescription(string code) =>
         FromCode(code)?.Description; // hàm lấy ra descriotion
    }
}
