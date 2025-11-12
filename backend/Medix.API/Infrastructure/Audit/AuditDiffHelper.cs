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
            var oldDict = oldObj as IDictionary<string, object?>
                          ?? newObj.GetType().GetProperties()
                               .ToDictionary(p => p.Name, p => (object?)null);

            var newDict = newObj as IDictionary<string, object?>
                          ?? newObj.GetType().GetProperties()
                               .ToDictionary(p => p.Name, p => p.GetValue(newObj));

            var diff = new Dictionary<string, object>();

            foreach (var key in newDict.Keys)
            {
                oldDict.TryGetValue(key, out var oldVal);
                var newVal = newDict[key];

                if (Equals(oldVal, newVal)) continue;

                // truncate old value
                var oldStr = oldVal?.ToString() ?? "";
                if (oldStr.Length > 50)
                    oldStr = oldStr.Substring(0, 50) + "...";

                diff[key] = new
                {
                    Old = oldStr,
                    New = newVal
                };
            }

            return JsonConvert.SerializeObject(diff, Formatting.Indented);
        }
    }

}
