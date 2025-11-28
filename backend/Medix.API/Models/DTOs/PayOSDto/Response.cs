namespace Medix.API.Models.DTOs.PayOSDto
{
    public record Response(
        int code,
        string message,
        object? data
    );
}
