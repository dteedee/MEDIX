using Medix.API.DataAccess;
using Medix.API.Infrastructure;
using System.Security.Claims;

namespace Medix.API.Presentation.Middleware
{
    public class AuditMiddleware
    {
        private readonly RequestDelegate _next;

        public AuditMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, UserContext userContext)
        {
            var ip = context.Connection.RemoteIpAddress?.ToString();
            userContext.IpAddress = ip;

            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                userContext.UserId = userId;
            }

            await _next(context);
        }
    }
}
