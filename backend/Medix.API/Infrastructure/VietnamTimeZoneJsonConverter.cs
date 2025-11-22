using System.Text.Json;
using System.Text.Json.Serialization;

namespace Medix.API.Infrastructure
{
    /// <summary>
    /// JSON Converter để tự động convert DateTime từ UTC sang giờ Việt Nam (UTC+7) khi serialize
    /// </summary>
    public class VietnamTimeZoneJsonConverter : JsonConverter<DateTime>
    {
        private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            // Hỗ trợ cả Windows và Linux
            try
            {
                // Windows timezone ID
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Linux/Mac timezone ID
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback: tạo timezone UTC+7 thủ công
                    return TimeZoneInfo.CreateCustomTimeZone(
                        "Vietnam Standard Time",
                        TimeSpan.FromHours(7),
                        "Vietnam Standard Time",
                        "Vietnam Standard Time");
                }
            }
        }

        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            // Khi deserialize (nhận từ client), giả sử client gửi lên giờ Việt Nam
            // Convert về UTC để lưu vào database
            if (reader.TokenType == JsonTokenType.String)
            {
                var dateTimeString = reader.GetString();
                if (DateTime.TryParse(dateTimeString, out var dateTime))
                {
                    // Nếu có timezone info, giữ nguyên
                    if (dateTime.Kind == DateTimeKind.Unspecified)
                    {
                        // Giả sử là giờ Việt Nam, convert về UTC
                        var vietnamTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Unspecified);
                        return TimeZoneInfo.ConvertTimeToUtc(vietnamTime, VietnamTimeZone);
                    }
                    return dateTime.ToUniversalTime();
                }
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                return default;
            }

            throw new JsonException($"Unexpected token type: {reader.TokenType}");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Khi serialize (trả về cho client), convert từ UTC sang giờ Việt Nam
            DateTime vietnamTime;
            
            if (value.Kind == DateTimeKind.Utc)
            {
                vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(value, VietnamTimeZone);
            }
            else if (value.Kind == DateTimeKind.Local)
            {
                vietnamTime = TimeZoneInfo.ConvertTime(value, VietnamTimeZone);
            }
            else
            {
                // Unspecified - giả sử đã là UTC
                vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(value, VietnamTimeZone);
            }

            // Tạo DateTimeOffset với timezone +07:00 để đảm bảo format đúng
            var offset = VietnamTimeZone.GetUtcOffset(vietnamTime);
            var dateTimeOffset = new DateTimeOffset(vietnamTime, offset);
            
            // Serialize dưới dạng ISO 8601 với timezone +07:00
            writer.WriteStringValue(dateTimeOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"));
        }
    }

    /// <summary>
    /// JSON Converter cho DateTime? (nullable DateTime)
    /// </summary>
    public class VietnamTimeZoneNullableJsonConverter : JsonConverter<DateTime?>
    {
        private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            // Hỗ trợ cả Windows và Linux
            try
            {
                // Windows timezone ID
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Linux/Mac timezone ID
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback: tạo timezone UTC+7 thủ công
                    return TimeZoneInfo.CreateCustomTimeZone(
                        "Vietnam Standard Time",
                        TimeSpan.FromHours(7),
                        "Vietnam Standard Time",
                        "Vietnam Standard Time");
                }
            }
        }

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            var converter = new VietnamTimeZoneJsonConverter();
            return converter.Read(ref reader, typeof(DateTime), new JsonSerializerOptions());
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }

            var converter = new VietnamTimeZoneJsonConverter();
            converter.Write(writer, value.Value, options);
        }
    }
}

