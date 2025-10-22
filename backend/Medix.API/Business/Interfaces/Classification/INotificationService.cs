using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface INotificationService
    {
        Task<List<Notification>> GetNotificationsAsync(Guid userId);
        Task<bool> IsAllNotificationsReadAsync(Guid userId);
    }
}
