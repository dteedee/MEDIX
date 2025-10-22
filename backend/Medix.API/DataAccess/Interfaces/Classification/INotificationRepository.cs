using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface INotificationRepository
    {
        Task<List<Notification>> GetNotificationsByUserIdAsync(Guid userId);
        Task<bool> IsAllNotificationsReadAsync(Guid userId);
    }
}
