using DiffPlex.DiffBuilder.Model;
using DiffPlex.DiffBuilder;
using Newtonsoft.Json;
using System.Text;

namespace Medix.API.Infrastructure.Audit
{
    public static class AuditDiffHelper
    {
        public static string BuildDiff(object? oldObj, object? newObj)
        {
            if (oldObj == null && newObj == null) return "";
            if (oldObj == null) return JsonConvert.SerializeObject(newObj, Formatting.Indented);
            if (newObj == null) return JsonConvert.SerializeObject(oldObj, Formatting.Indented);

            var oldJson = JsonConvert.SerializeObject(oldObj, Formatting.Indented);
            var newJson = JsonConvert.SerializeObject(newObj, Formatting.Indented);

            var diff = InlineDiffBuilder.Diff(oldJson, newJson);

            var sb = new StringBuilder();
            foreach (var line in diff.Lines)
            {
                switch (line.Type)
                {
                    case ChangeType.Inserted:
                        sb.AppendLine($"+ {line.Text}");
                        break;
                    case ChangeType.Deleted:
                        sb.AppendLine($"- {line.Text}");
                        break;
                    case ChangeType.Modified:
                        sb.AppendLine($"~ {line.Text}");
                        break;
                    default:
                        break;
                }
            }

            return sb.ToString();
        }
    }
}
