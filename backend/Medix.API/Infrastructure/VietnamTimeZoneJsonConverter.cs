using System.Text.Json;
using System.Text.Json.Serialization;

namespace Medix.API.Infrastructure
{

    public class VietnamTimeZoneJsonConverter : JsonConverter<DateTime>
    {
        private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
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

            if (reader.TokenType == JsonTokenType.String)
            {
                var dateTimeString = reader.GetString();
                if (DateTime.TryParse(dateTimeString, out var dateTime))
                {
                    if (dateTime.Kind == DateTimeKind.Unspecified)
                    {
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
            if (value == DateTime.MinValue)
            {
                writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
                return;
            }

            DateTime vietnamTime;

            if (value.Kind == DateTimeKind.Utc)
            {
                vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(value, VietnamTimeZone);
            }
            else if (value.Kind == DateTimeKind.Local)
            {
                vietnamTime = TimeZoneInfo.ConvertTime(value, TimeZoneInfo.Local, VietnamTimeZone);
            }
            else 
            {
                vietnamTime = value;
            }

            var offset = VietnamTimeZone.GetUtcOffset(vietnamTime);

           
            var dateTimeOffset = new DateTimeOffset(vietnamTime, offset);

            writer.WriteStringValue(dateTimeOffset.ToString("yyyy-MM-ddTHH:mm:ss.fffzzz"));
        }
    }

    public class VietnamTimeZoneNullableJsonConverter : JsonConverter<DateTime?>
    {
        private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
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

