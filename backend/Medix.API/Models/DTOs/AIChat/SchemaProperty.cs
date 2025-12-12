namespace Medix.API.Models.DTOs.AIChat
{
    public class SchemaProperty
    {
        public SchemaPropertyType Type { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
        public object? Value { get; set; }
    }

    public class EnumPropertyValue
    {
        public EnumPropertyType Type { get; set; }
        public object Values { get; set; } = null!;
    }
}
