using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controller.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null)
            {
                return Unauthorized();
            }
            var userId = Guid.Parse(userIdClaim.Value);
            var notificationList = await _notificationService.GetNotificationsAsync(userId);
            var notifications = notificationList.Select(n => new
            {
                n.Title,
                n.Message,
                n.Type,
                n.CreatedAt,
            }).ToList();
            var isAllRead = await _notificationService.IsAllNotificationsReadAsync(userId);
            return Ok(new {isAllRead, notifications});
        }
    }
}
