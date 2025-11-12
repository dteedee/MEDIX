using System.Text.RegularExpressions;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;
using Medix.API.Models.Entities;

namespace Medix.API.Infrastructure.Audit
{
    public static class AuditEntryHelper
    {
        private static readonly string[] SensitiveFields =
        {
        "Password", "Token", "AccessToken", "RefreshToken",
        "SecretKey", "ApiKey"
    };

        private static readonly string[] ManyToManyEntities =
        {
        "ArticleCategory",
        "ContentCategoryArticle"
    };

        public static List<AuditLog> CreateAuditLogs(this DbContext context, Guid? userId, string? ipAddress)
        {
            var auditLogs = new List<AuditLog>();

            var entries = context.ChangeTracker
                .Entries()
                .Where(e => e.State == EntityState.Added ||
                            e.State == EntityState.Modified ||
                            e.State == EntityState.Deleted)
                // ✅ BỎ QUA bảng nhiều-nhiều
                .Where(e => !ManyToManyEntities.Contains(e.Entity.GetType().Name))
                .ToList();

            foreach (var entry in entries)
            {
                var entityName = entry.Entity.GetType().Name;

                var log = new AuditLog
                {
                    UserId = userId,
                    EntityType = entityName,
                    EntityId = GetPrimaryKey(entry),
                    IpAddress = ipAddress,
                    Timestamp = DateTime.UtcNow,
                    ActionType = entry.State.ToString()
                };

                if (entry.State == EntityState.Added)
                {
                    log.NewValues = Sanitize(JsonSerializer.Serialize(entry.CurrentValues.ToObject()));
                }
                else if (entry.State == EntityState.Modified)
                {
                    var oldObj = GetChangedOriginalValues(entry);
                    var newObj = GetChangedCurrentValues(entry);

                    log.NewValues = AuditDiffHelper.BuildDiff(oldObj, newObj);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    log.OldValues = Sanitize(JsonSerializer.Serialize(entry.OriginalValues.ToObject()));
                }

                auditLogs.Add(log);
            }

            return auditLogs;
        }

        private static string Sanitize(string json)
        {
            if (string.IsNullOrEmpty(json)) return json;

            foreach (var field in SensitiveFields)
            {
                json = Regex.Replace(json,
                    $"\"{field}\"\\s*:\\s*\".*?\"",
                    $"\"{field}\":\"[HIDDEN]\"",
                    RegexOptions.IgnoreCase);
            }

            return json;
        }

        private static string GetPrimaryKey(EntityEntry entry)
        {
            return entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())
                       ?.CurrentValue?.ToString()
                   ?? "";
        }

        private static Dictionary<string, object?> GetChangedOriginalValues(EntityEntry entry)
        {
            return entry.Properties
                .Where(p => p.IsModified)
                .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue);
        }

        private static Dictionary<string, object?> GetChangedCurrentValues(EntityEntry entry)
        {
            return entry.Properties
                .Where(p => p.IsModified)
                .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
        }
    }

}
