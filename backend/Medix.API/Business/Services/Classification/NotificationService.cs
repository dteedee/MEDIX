using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task<List<Notification>> GetNotificationsAsync(Guid userId)
        {
            return await _notificationRepository.GetNotificationsByUserIdAsync(userId);
        }

        public async Task<bool> IsAllNotificationsReadAsync(Guid userId)
        {
            return await _notificationRepository.IsAllNotificationsReadAsync(userId);
        }

        public async Task<Notification> CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityId = relatedEntityId,
                IsRead = false
            };

            return await _notificationRepository.CreateNotificationAsync(notification);
        }
    }
}
