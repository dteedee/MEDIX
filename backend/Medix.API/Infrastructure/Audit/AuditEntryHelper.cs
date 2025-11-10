using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Medix.API.Infrastructure.Audit
{
    public static class AuditEntryHelper
    {
        public static List<AuditLog> CreateAuditLogs(this DbContext context, Guid? userId, string? ipAddress)
        {
            var auditLogs = new List<AuditLog>();
            var changeTracker = context.ChangeTracker
                .Entries()
                .Where(e => e.State == EntityState.Added ||
                            e.State == EntityState.Modified ||
                            e.State == EntityState.Deleted)
                .ToList();

            foreach (var entry in changeTracker)
            {
                var log = new AuditLog
                {
                    UserId = userId,
                    EntityType = entry.Entity.GetType().Name,
                    EntityId = GetPrimaryKey(entry),
                    IpAddress = ipAddress,
                    Timestamp = DateTime.UtcNow,
                    ActionType = entry.State.ToString()
                };

                if (entry.State == EntityState.Added)
                {
                    log.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                }
                else if (entry.State == EntityState.Modified)
                {
                    log.OldValues = JsonSerializer.Serialize(GetChangedOriginalValues(entry));
                    log.NewValues = JsonSerializer.Serialize(GetChangedCurrentValues(entry));
                }
                else if (entry.State == EntityState.Deleted)
                {
                    log.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                }

                auditLogs.Add(log);
            }

            return auditLogs;
        }

        private static string GetPrimaryKey(EntityEntry entry)
        {
            var key = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
            return key?.CurrentValue?.ToString() ?? string.Empty;
        }

        private static Dictionary<string, object?> GetChangedOriginalValues(EntityEntry entry)
        {
            var changes = new Dictionary<string, object?>();
            foreach (var prop in entry.Properties)
            {
                if (prop.IsModified)
                {
                    changes[prop.Metadata.Name] = prop.OriginalValue;
                }
            }
            return changes;
        }

        private static Dictionary<string, object?> GetChangedCurrentValues(EntityEntry entry)
        {
            var changes = new Dictionary<string, object?>();
            foreach (var prop in entry.Properties)
            {
                if (prop.IsModified)
                {
                    changes[prop.Metadata.Name] = prop.CurrentValue;
                }
            }
            return changes;
        }
    }
}
