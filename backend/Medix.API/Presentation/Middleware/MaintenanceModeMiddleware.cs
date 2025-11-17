using System.Linq;
using System.Security.Claims;
using Medix.API.Business.Interfaces.Classification;

namespace Medix.API.Presentation.Middleware
{
    public class MaintenanceModeMiddleware
    {
        private static readonly string[] AllowedPrefixes =
        [
            "/swagger",
            "/hangfire",
            "/api/systemconfiguration",
            "/api/auth",
            "/api/maintenance",
            "/health"
        ];

        private readonly RequestDelegate _next;
        private readonly ILogger<MaintenanceModeMiddleware> _logger;

        public MaintenanceModeMiddleware(RequestDelegate next, ILogger<MaintenanceModeMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ISystemConfigurationService configurationService)
        {
            if (HttpMethods.Options.Equals(context.Request.Method, StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            var isMaintenance = await configurationService.GetBoolValueAsync("MAINTENANCE_MODE") ?? false;
            if (!isMaintenance)
            {
                await _next(context);
                return;
            }

            if (IsAllowListedPath(context.Request.Path) || IsAdminRequest(context.User))
            {
                await _next(context);
                return;
            }

            var message = await configurationService.GetValueAsync<string>("MAINTENANCE_MESSAGE")
                          ?? "Hệ thống đang bảo trì. Vui lòng quay lại sau.";
            var schedule = await configurationService.GetValueAsync<string>("MAINTENANCE_SCHEDULE");

            _logger.LogWarning("Request blocked due to maintenance mode. Path: {Path}", context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                message,
                schedule
            });
        }

        private static bool IsAllowListedPath(PathString path)
        {
            var value = path.Value?.ToLowerInvariant() ?? string.Empty;
            return AllowedPrefixes.Any(prefix => value.StartsWith(prefix));
        }

        private static bool IsAdminRequest(ClaimsPrincipal principal)
        {
            if (principal?.Identity?.IsAuthenticated != true)
                return false;

            return principal.IsInRole("Admin") || principal.IsInRole("SuperAdmin");
        }
    }
}

