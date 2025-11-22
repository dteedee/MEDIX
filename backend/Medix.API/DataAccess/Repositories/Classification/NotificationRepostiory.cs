using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class NotificationRepostiory : INotificationRepository
    {
        private readonly MedixContext _context;

        public NotificationRepostiory(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<Notification>> GetNotificationsByUserIdAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(10)
                .ToListAsync();
        }

        public async Task<bool> IsAllNotificationsReadAsync(Guid userId)
        {
            return !await _context.Notifications
                .AnyAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            notification.Id = Guid.NewGuid();
            notification.CreatedAt = DateTime.UtcNow;
            notification.IsRead = false;
            
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            
            return notification;
        }
    }
}
