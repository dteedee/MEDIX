using Medix.API.Models.DTOs.AIChat;
using System.Text.Json;

namespace Medix.API.Business.Helper
{
    public class AIResponseParser
    {
        public static DiagnosisModel ParseJson(string rawJsonOutput)
        {
            if (string.IsNullOrEmpty(rawJsonOutput))
            {
                throw new ArgumentException("Input JSON string is null or empty");
            }

            try
            {
                var diagnosisResult = JsonSerializer.Deserialize<DiagnosisModel>(rawJsonOutput);
                if (diagnosisResult == null)
                {
                    throw new JsonException("Deserialized object is null");
                }
                return diagnosisResult;
            }
            catch (JsonException ex)
            {
                throw new JsonException("Failed to parse JSON response", ex);
            }
        }
    }
}
