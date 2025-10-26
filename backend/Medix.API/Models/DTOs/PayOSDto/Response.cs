namespace Medix.API.Models.DTOs.PayOSDto
{
    /// <summary>
    /// Định nghĩa cấu trúc trả về JSON chuẩn cho API
    /// </summary>
    public record Response(
        int code,
        string message,
        object? data
    );
}
