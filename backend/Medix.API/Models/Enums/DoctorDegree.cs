namespace Medix.API.Models.Enums
{
    public record OverrideTypeEnum(string Code, string Description)
    {
        public static readonly OverrideTypeEnum Availability = new("AVAILABILITY", "Lịch làm việc bổ sung");

        /// <summary>
        /// Bác sĩ VẮNG MẶT (nghỉ, bận, đi hội thảo...).
        /// </summary>
        public static readonly OverrideTypeEnum Unavailability = new("UNAVAILABILITY", "Lịch nghỉ/bận");

        // --- Các hàm tiện ích ---

        /// <summary>
        /// Trả về một danh sách tất cả các loại ghi đè.
        /// </summary>
        public static IEnumerable<OverrideTypeEnum> List() => new[]
        {
            Availability, Unavailability
        };

        /// <summary>
        /// Tìm loại ghi đè dựa trên Mã (Code).
        /// </summary>
        public static OverrideTypeEnum? FromCode(string code) =>
            List().FirstOrDefault(d =>
                d.Code.Equals(code, System.StringComparison.OrdinalIgnoreCase));

        /// <summary>
        /// Lấy mô tả (Description) từ Mã (Code).
        /// </summary>
        public static string? GetDescription(string code) =>
            FromCode(code)?.Description;
    }
}
