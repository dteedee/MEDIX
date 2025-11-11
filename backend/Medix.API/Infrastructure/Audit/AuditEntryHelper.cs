using System.Text.RegularExpressions;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore;
using Medix.API.Models.Entities;

namespace Medix.API.Infrastructure.Audit
{
    public static class AuditEntryHelper
    {
        // Danh sách entity không audit
        private static readonly string[] IgnoredEntities =
        {
            "RefreshToken",
            "AccessToken",
            "LoginSession",
            "UserToken"
        };

        // Các field nhạy cảm cần ẩn
        private static readonly string[] SensitiveFields =
        {
            "Password", "Token", "AccessToken", "RefreshToken", "SecretKey", "ApiKey"
        };

        public static List<AuditLog> CreateAuditLogs(this DbContext context, Guid? userId, string? ipAddress)
        {
            var auditLogs = new List<AuditLog>();

            var entries = context.ChangeTracker
      .Entries()
      .Where(e => e.State == EntityState.Added
               || e.State == EntityState.Modified
               || e.State == EntityState.Deleted)
      // Bỏ qua hoàn toàn entity liên quan đến Token
      .Where(e => !(
          e.Entity.GetType().Name.Contains("RefreshToken", StringComparison.OrdinalIgnoreCase) ||
          e.Entity.GetType().Name.Contains("AccessToken", StringComparison.OrdinalIgnoreCase) ||
          e.Entity.GetType().Name.Contains("UserToken", StringComparison.OrdinalIgnoreCase) ||
          e.Entity.GetType().Name.Contains("LoginSession", StringComparison.OrdinalIgnoreCase)))
      .ToList();


            foreach (var entry in entries)
            {
                var entityType = entry.Entity.GetType();
                var entityName = entityType.Name;

                // ⚠️ Bỏ qua hoàn toàn các entity chứa token
                if (entityName.Contains("RefreshToken", StringComparison.OrdinalIgnoreCase)
                    || entityName.Contains("AccessToken", StringComparison.OrdinalIgnoreCase)
                    || entityName.Contains("LoginSession", StringComparison.OrdinalIgnoreCase)
                    || entityName.Contains("UserToken", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"[Audit] Skipping token entity: {entityName}");
                    continue;
                }

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
                    log.NewValues = SanitizeSensitiveData(JsonSerializer.Serialize(entry.CurrentValues.ToObject()));
                }
                else if (entry.State == EntityState.Modified)
                {
                    log.OldValues = SanitizeSensitiveData(JsonSerializer.Serialize(GetChangedOriginalValues(entry)));
                    log.NewValues = SanitizeSensitiveData(JsonSerializer.Serialize(GetChangedCurrentValues(entry)));
                }
                else if (entry.State == EntityState.Deleted)
                {
                    log.OldValues = SanitizeSensitiveData(JsonSerializer.Serialize(entry.OriginalValues.ToObject()));
                }

                auditLogs.Add(log);
            }

            return auditLogs;
        }


        /// <summary>
        /// Ẩn các field nhạy cảm như Token, Password... trong JSON
        /// </summary>
        private static string SanitizeSensitiveData(string json)
        {
            if (string.IsNullOrEmpty(json))
                return json;

            // Regex xử lý mạnh hơn, hỗ trợ cả trường hợp không có dấu ngoặc kép chuẩn
            foreach (var field in SensitiveFields)
            {
                // Cả chữ hoa/thường và field nằm trong hoặc ngoài dấu ngoặc kép
                var patterns = new[]
                {
                    $"\"{field}\"\\s*:\\s*\"[^\"]*\"",
                    $"'{field}'\\s*:\\s*'[^']*'",
                    $"{field}\\s*:\\s*\"[^\"]*\"",
                    $"{field}\\s*:\\s*'[^']*'",
                    $"{field}\\s*:\\s*[^,}}]+" // fallback
                };

                foreach (var pattern in patterns)
                {
                    json = Regex.Replace(json, pattern, $"\"{field}\":\"[HIDDEN]\"", RegexOptions.IgnoreCase);
                }
            }

            return json;
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
                    changes[prop.Metadata.Name] = prop.OriginalValue;
            }
            return changes;
        }

        private static Dictionary<string, object?> GetChangedCurrentValues(EntityEntry entry)
        {
            var changes = new Dictionary<string, object?>();
            foreach (var prop in entry.Properties)
            {
                if (prop.IsModified)
                    changes[prop.Metadata.Name] = prop.CurrentValue;
            }
            return changes;
        }
    }
}
