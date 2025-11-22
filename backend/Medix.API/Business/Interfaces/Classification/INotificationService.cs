using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface INotificationService
    {
        Task<List<Notification>> GetNotificationsAsync(Guid userId);
        Task<bool> IsAllNotificationsReadAsync(Guid userId);
        Task<Notification> CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId = null);
    }
}
