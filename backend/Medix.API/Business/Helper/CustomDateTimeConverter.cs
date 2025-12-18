using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Medix.API.Business.Helper
{
    public class CustomDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var str = reader.GetString();
            if (DateTime.TryParse(str, null, DateTimeStyles.RoundtripKind, out var dt))
                return dt;
            throw new JsonException("Invalid date format");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            var vnTimeZone = GetVietnamTimeZone();

            var vietnamTime = value.Kind == DateTimeKind.Utc
                ? TimeZoneInfo.ConvertTimeFromUtc(value, vnTimeZone)
                : TimeZoneInfo.ConvertTime(value, vnTimeZone);

            var formatted = vietnamTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff", CultureInfo.InvariantCulture) + "+07:00";
            writer.WriteStringValue(formatted);
        }

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            // Linux/macOS id: "Asia/Ho_Chi_Minh"; Windows id: "SE Asia Standard Time"
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }
            catch
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                }
                catch
                {
                    return TimeZoneInfo.CreateCustomTimeZone("VN(+07)", TimeSpan.FromHours(7), "Vietnam Time", "Vietnam Time");
                }
            }
        }
    }
}
