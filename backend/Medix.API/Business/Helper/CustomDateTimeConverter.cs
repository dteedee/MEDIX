using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Medix.API.Business.Helper
{
    public class CustomDateTimeConverter : JsonConverter<DateTime>
    {
        // Đọc từ JSON về DateTime (deserialize): giữ nguyên, có thể cho phép cả UTC/ISO
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var str = reader.GetString();
            // Đọc cả ISO chuẩn và cả dạng custom
            if (DateTime.TryParse(str, null, DateTimeStyles.RoundtripKind, out var dt))
                return dt;
            // Nếu cần, bạn có thể xử lý thêm các format đặc biệt ở đây
            throw new JsonException("Invalid date format");
        }

        // Ghi ra JSON (serialize): chuyển UTC sang giờ Việt Nam và format kèm offset
        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Nếu gốc là UTC, cộng 7 giờ
            var vietnamTime = value.Kind == DateTimeKind.Utc ? value.AddHours(7) : value;
            // Format đúng chuẩn ISO 8601 kèm offset '+07:00'
            var formatted = vietnamTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff", CultureInfo.InvariantCulture) + "+07:00";
            writer.WriteStringValue(formatted);
        }
    }
}
