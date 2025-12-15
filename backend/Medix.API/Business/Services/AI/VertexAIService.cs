using Google.Cloud.AIPlatform.V1;
using Google.Protobuf.WellKnownTypes;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Models.DTOs.AIChat;
using Value = Google.Protobuf.WellKnownTypes.Value;

namespace Medix.API.Business.Services.AI
{
    public class VertexAIService : IVertexAIService
    {
        private readonly PredictionServiceClient _client;
        private readonly IConfiguration _configuration;

        private readonly string ModelResourceName;

        public VertexAIService(
            PredictionServiceClient client,
            IConfiguration configuration)
        {
            _client = client;
            _configuration = configuration;

            var project = _configuration["GoogleCloud:ProjectId"];
            var location = _configuration["GoogleCloud:VertexAILocation"] ?? "us-central1";
            var model = _configuration["GoogleCloud:VertexAIModel"] ?? "gemini-2.5-flash-lite";

            ModelResourceName = $"projects/{project}/locations/{location}/publishers/google/models/{model}";
        }

        public async Task<string> GetResponseAsync
            (string prompt, List<AIChatMessageDto> conversationHistory, ResponseSchema responseSchema, string? systemInstruction = null)
        {
            var contents = GetContents(conversationHistory);
            var jsonSchema = GetResponseSchema(responseSchema);

            contents.Add(new()
            {
                Role = "user",
                Parts =
                    {
                        new Part
                        {
                            Text = prompt
                        }
                    }
            });

            var request = new GenerateContentRequest
            {
                Model = ModelResourceName,
                Contents = { contents },
                GenerationConfig = new GenerationConfig
                {
                    ResponseJsonSchema = jsonSchema,
                    ResponseMimeType = "application/json"
                }
            };

            if (!string.IsNullOrEmpty(systemInstruction))
            {
                request.SystemInstruction = new Content
                {
                    Role = "system",
                    Parts =
                    {
                        new Part
                        {
                            Text = systemInstruction
                        }
                    }
                };
            }

            var response = await _client.GenerateContentAsync(request);
            string generatedText = response.Candidates[0].Content.Parts[0].Text;
            return generatedText;
        }

        private List<Content> GetContents(List<AIChatMessageDto> history)
        {
            var contents = new List<Content>();

            foreach (var item in history)
            {
                var content = new Content
                {
                    Role = item.Role == "user" ? "user" : "assistant",
                    Parts = {
                        new Part
                        {
                            Text = item.Content
                        },
                    }
                };
                contents.Add(content);
            }

            return contents;
        }

        private Value GetResponseSchema(ResponseSchema jsonSchema)
        {
            var schemaStruct = new Struct();
            foreach (var property in jsonSchema.Properties)
            {
                var field = GetField(property);
                schemaStruct.Fields.Add(field);
            }

            return Value.ForStruct(new Struct
            {
                Fields =
                {
                    { "type", Value.ForString("object") },
                    { "properties", Value.ForStruct(schemaStruct)},
                    { "required", Value.ForList(jsonSchema.Properties.Select(p => Value.ForString(p.Name)).ToArray()) }
                }
            });
        }

        private Dictionary<string, Value> GetField(SchemaProperty property)
        {
            var value = GetPropertyAsValue(property);

            return new Dictionary<string, Value> {
                { property.Name, value }
            };
        }

        private Value GetPropertyAsValue(SchemaProperty property)
        {
            return property.Type switch
            {
                SchemaPropertyType.String => GetStringPropertyAsValue(property),
                SchemaPropertyType.Array => GetArrayPropertyAsValue(property),
                SchemaPropertyType.Enum => GetEnumPropertyAsValue(property),
                SchemaPropertyType.Number => GetNumberPropertyAsValue(property),
                SchemaPropertyType.Boolean => GetBooleanPropertyAsValue(property),
                SchemaPropertyType.Object => GetObjectPropertyAsValue(property),
                _ => new Value(),
            };
        }

        private Value GetStringPropertyAsValue(SchemaProperty property)
        {
            return Value.ForStruct(new Struct
            {
                Fields =
                    {
                        { "type", Value.ForString("string") },
                        { "description", Value.ForString(property.Description) }
                    }
            });
        }

        private Value GetArrayPropertyAsValue(SchemaProperty property)
        {
            var arrayItem = property.Value as SchemaProperty;

            return Value.ForStruct(new Struct
            {
                Fields =
                    {
                        { "type", Value.ForString("array") },
                        { "description", Value.ForString(property.Description) },
                        { "items", GetPropertyAsValue(arrayItem!) },
                    }
            });
        }

        private Value GetEnumPropertyAsValue(SchemaProperty property)
        {
            var propertyStruct = new Struct();
            propertyStruct.Fields.Add(new Dictionary<string, Value>
            {
                { "description", Value.ForString(property.Description) },
            });

            var enumValue = property.Value as EnumPropertyValue;
            var enumItems = enumValue?.Type switch
            {
                EnumPropertyType.String => GetStringEnumValues(enumValue),
                EnumPropertyType.Number => GetNumberEnumValues(enumValue),
                EnumPropertyType.Boolean => GetBooleanEnumValues(enumValue),
                _ => [],
            };

            propertyStruct.Fields.Add(enumItems);
            return Value.ForStruct(propertyStruct);
        }

        private Value GetNumberPropertyAsValue(SchemaProperty property)
        {
            return Value.ForStruct(new Struct
            {
                Fields =
                    {
                        { "type", Value.ForString("number") },
                        { "description", Value.ForString(property.Description) }
                    }
            });
        }

        private Value GetBooleanPropertyAsValue(SchemaProperty property)
        {
            return Value.ForStruct(new Struct
            {
                Fields =
                    {
                        { "type", Value.ForString("boolean") },
                        { "description", Value.ForString(property.Description) }
                    }
            });
        }

        private Value GetObjectPropertyAsValue(SchemaProperty property)
        {
            var objectFields = (property.Value as SchemaProperty[]) ?? [];
            var propertyStruct = new Struct();
            var propertyFieldStruct = new Struct();

            propertyStruct.Fields.Add(new Dictionary<string, Value>
            {
                { "types", Value.ForString("object") },
                { "description", Value.ForString(property.Description) },
            });

            foreach (var field in objectFields)
            {
                var fieldValue = GetPropertyAsValue(field);
                propertyFieldStruct.Fields.Add(new Dictionary<string, Value>
                {
                    { field.Name, fieldValue },
                });
            }

            propertyStruct.Fields.Add(new Dictionary<string, Value>
            {
                { "properties", Value.ForStruct(propertyFieldStruct)},
            });

            return Value.ForStruct(propertyStruct);
        }

        private Dictionary<string, Value> GetStringEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as string[];
            values ??= [];

            return new Dictionary<string, Value>
            {
                { "type", Value.ForString("string") },
                { "enum", Value.ForList(values.Select(v => Value.ForString(v)).ToArray()) },
            };
        }

        private Dictionary<string, Value> GetNumberEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as double[];
            values ??= [];

            return new Dictionary<string, Value>
            {
                { "type", Value.ForString("string") },
                { "enum", Value.ForList(values.Select(v => Value.ForNumber(v)).ToArray()) },
            };
        }

        private Dictionary<string, Value> GetBooleanEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as bool[];
            values ??= [];

            return new Dictionary<string, Value>
            {
                { "type", Value.ForString("string") },
                { "enum", Value.ForList(values.Select(v => Value.ForBool(v)).ToArray()) },
            };
        }
    }
}
