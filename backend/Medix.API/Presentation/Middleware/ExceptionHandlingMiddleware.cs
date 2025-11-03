using System.Net;
using System.Text.Json;
using Medix.API.Exceptions;

namespace Medix.API.Presentation.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // Không log ở đây nữa, chuyển logic log vào HandleExceptionAsync
                await HandleExceptionAsync(context, ex, _logger);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception, ILogger<ExceptionHandlingMiddleware> logger)
        {
            context.Response.ContentType = "application/json";

            switch (exception)
            {
                case ValidationException vex:
                    // Log lỗi validation với chi tiết các trường
                    logger.LogWarning("Validation error occurred: {ValidationErrors}", JsonSerializer.Serialize(vex.Errors));
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    var payload = JsonSerializer.Serialize(new { message = "Một hoặc nhiều lỗi xác thực đã xảy ra.", errors = vex.Errors });
                    await context.Response.WriteAsync(payload);
                    return;
                case NotFoundException nfe:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = nfe.Message }));
                    return;
                case UnauthorizedException uae:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = uae.Message }));
                    return;
                case MedixException mex:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = mex.Message }));
                    return;
                // THÊM CASE NÀY ĐỂ XỬ LÝ LỖI NGHIỆP VỤ
                case InvalidOperationException ioe:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest; // Lỗi nghiệp vụ là Bad Request (400)
                    // Trả về trực tiếp message của exception, không cần gói trong JSON
                    await context.Response.WriteAsync(ioe.Message);
                    return;
                default:
                    // Log lỗi không xác định (lỗi 500)
                    logger.LogError(exception, "An unhandled exception has occurred.");
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = "Đã có lỗi không mong muốn xảy ra." }));
                    return;
            }
        }
    }
}
