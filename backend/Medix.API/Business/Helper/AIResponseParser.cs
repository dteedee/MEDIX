using Medix.API.Models.DTOs.AIChat;
using System.Text.Json;

namespace Medix.API.Business.Helper
{
    public class AIResponseParser
    {
        private static readonly string GeneralErrorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau";

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

        public static string? GetResponse(string rawJsonOutput)
        {
            try
            {
                var diagnosisResult = ParseJson(rawJsonOutput);

                if (diagnosisResult == null)
                {
                    return GeneralErrorMessage;
                }

                if (diagnosisResult.IsRequestRejected)
                {
                    return diagnosisResult.UserResponseText;
                }
                else if (diagnosisResult.IsConclusionReached)
                { 
                    return GetSuccessfulResponseText(diagnosisResult);
                }
                else
                {
                    return diagnosisResult.UserResponseText;
                }
            }
            catch (ArgumentException)
            {
                return GeneralErrorMessage;
            }
            catch
            {
                throw;
            }
        }

        private static string GetSuccessfulResponseText(DiagnosisModel diagnosisResult)
        {
            string result = "";

            result += diagnosisResult.UserResponseText;
            result += $"\n\n{diagnosisResult.RecommendedAction}";
            result += $"\n\nĐộ nghiêm trọng: {diagnosisResult.SeverityCode}";
            result += $"\n\nĐộ chuẩn xác: {diagnosisResult.ConfidenceScore * 100}%";

            return result;
        }
    }
}
