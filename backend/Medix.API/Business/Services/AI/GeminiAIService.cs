using Google.GenAI.Types;
using Google.GenAI;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Models.DTOs.AIChat;
using Type = Google.GenAI.Types.Type;

namespace Medix.API.Business.Services.AI
{
    public class GeminiAIService : IGeminiAIService
    {
        private readonly Client _client;
        private readonly string Model;

        public GeminiAIService(
            Client client,
            IConfiguration configuration)
        {
            _client = client;
            Model = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        public async Task<string> GetResponseAsync
            (string prompt, List<AIChatMessageDto> conversationHistory, ResponseSchema responseSchema, string? systemInstruction = null)
        {
            var contents = GetConversationHistory(conversationHistory);
            contents.Add(new Content
            {
                Role = "user",
                Parts =
                    [
                        new Part
                        {
                            Text = prompt
                        }
                    ]
            });

            var responseJsonSchema = GetResponseSchema(responseSchema);

            var systemConfigs = new GenerateContentConfig
            {
                ResponseMimeType = "application/json",
                ResponseSchema = responseJsonSchema,
            };

            if (systemInstruction != null)
            {
                var systemContent = new Content
                {
                    Parts =
                    [
                        new Part
                            {
                                Text = systemInstruction
                            }
                    ],
                    Role = "system"
                };

                systemConfigs.SystemInstruction = systemContent;
            };

            var response = await _client.Models.GenerateContentAsync(
                model: Model,
                contents: contents,
                config: systemConfigs
            );

            if (response.Candidates != null && response.Candidates.Count != 0)
            {
                var modelResponse = response.Candidates[0].Content;
                if (modelResponse == null
                    || modelResponse.Parts == null
                    || modelResponse.Parts.Count == 0
                    || modelResponse.Parts[0].Text == null)
                {
                    throw new Exception("Model response has no content parts.");
                }
                var rawText = modelResponse.Parts[0].Text!.ToString();
                return rawText;
            }
            else
            {
                var reason = response.PromptFeedback?.BlockReason.ToString() ?? "Unknown";
                throw new Exception(reason);
            }
        }

        private List<Content> GetConversationHistory(List<AIChatMessageDto> messages)
        {
            var conversationHistory = new List<Content>();
            foreach (var item in messages)
            {
                var content = new Content
                {
                    Role = item.Role.ToLower() == "user" ? "user" : "model",
                    Parts = [
                        new Part
                        {
                            Text = item.Content
                        },
                    ]
                };
                conversationHistory.Add(content);
            }

            return conversationHistory;
        }

        private Schema GetResponseSchema(ResponseSchema responseSchema)
        {
            var responseProperties = new Dictionary<string, Schema>();

            foreach (var item in responseSchema.Properties)
            {
                responseProperties.Add(item.Name, GetPropertySchema(item));
            }

            return new Schema
            {
                Type = Type.OBJECT,
                Properties = responseProperties,
                Required = responseSchema.Properties.Select(p => p.Name).ToList(),
            };
        }

        private Schema GetPropertySchema(SchemaProperty schemaProperty)
        {
            return schemaProperty.Type switch
            {
                SchemaPropertyType.String => GetStringPropertyAsSchema(schemaProperty),
                SchemaPropertyType.Array => GetArrayPropertyAsSchema(schemaProperty),
                SchemaPropertyType.Enum => GetEnumPropertyAsSchema(schemaProperty),
                SchemaPropertyType.Number => GetNumberPropertyAsSchema(schemaProperty),
                SchemaPropertyType.Boolean => GetBooleanPropertyAsSchema(schemaProperty),
                SchemaPropertyType.Object => GetObjectPropertyAsSchema(schemaProperty),
                _ => new Schema(),
            };
        }

        private Schema GetStringPropertyAsSchema(SchemaProperty schemaProperty)
        {
            return new Schema()
            {
                Type = Type.STRING,
                Description = schemaProperty.Description,
            };
        }

        private Schema GetArrayPropertyAsSchema(SchemaProperty schemaProperty)
        {
            var itemsProperty = schemaProperty.Value as SchemaProperty;

            return new Schema()
            {
                Type = Type.ARRAY,
                Description = schemaProperty.Description,
                Items = GetPropertySchema(itemsProperty!),
            };
        }

        private Schema GetEnumPropertyAsSchema(SchemaProperty schemaProperty)
        {
            var enumValue = schemaProperty.Value as EnumPropertyValue;
            var propertySchema = new Schema
            {
                Description = schemaProperty.Description,
            };

            switch (enumValue?.Type)
            {
                case EnumPropertyType.String:
                    propertySchema.Type = Type.STRING;
                    propertySchema.Enum = GetStringEnumValues(enumValue);
                    break;
                case EnumPropertyType.Boolean:
                    propertySchema.Type = Type.BOOLEAN;
                    propertySchema.Enum = GetBooleanEnumValues(enumValue);
                    break;
                case EnumPropertyType.Number:
                    propertySchema.Type = Type.NUMBER;
                    propertySchema.Enum = GetNumberEnumValues(enumValue);
                    break;
            }

            return propertySchema;
        }

        private Schema GetNumberPropertyAsSchema(SchemaProperty schemaProperty)
        {
            return new Schema()
            {
                Type = Type.NUMBER,
                Description = schemaProperty.Description,
                Format = "float"
            };
        }

        private Schema GetBooleanPropertyAsSchema(SchemaProperty schemaProperty)
        {
            return new Schema()
            {
                Type = Type.BOOLEAN,
                Description = schemaProperty.Description,
            };
        }

        private Schema GetObjectPropertyAsSchema(SchemaProperty schemaProperty)
        {
            var fields = schemaProperty.Value as List<SchemaProperty> ?? [];

            var responseProperties = new Dictionary<string, Schema>();

            foreach (var item in fields)
            {
                responseProperties.Add(item.Name, GetPropertySchema(item));
            }

            return new Schema
            {
                Type = Type.OBJECT,
                Properties = responseProperties,
                Required = fields.Select(p => p.Name).ToList(),
            };
        }

        private List<string> GetStringEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as string[];
            return values?.ToList() ?? [];
        }

        private List<string> GetBooleanEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as bool[];
            return values?.Select(v => v.ToString()).ToList() ?? [];
        }

        private List<string> GetNumberEnumValues(EnumPropertyValue property)
        {
            var values = property.Values as double[];
            return values?.Select(v => v.ToString()).ToList() ?? [];
        }
    }
}
