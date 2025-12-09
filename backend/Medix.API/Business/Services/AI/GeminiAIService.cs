using Google.GenAI;
using Google.GenAI.Types;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Models.DTOs.AIChat;
using System.Text;
using System.Text.Json;
using Type = Google.GenAI.Types.Type;

namespace Medix.API.Business.Services.AI
{
    public class GeminiAIService : IGeminiAIService
    {
        private static readonly Dictionary<string, Schema> SymptomAnalysisSchemaProperties = new Dictionary<string, Schema>
        {
            // User-Facing Field
            ["UserResponseText"] = new Schema
            {
                Type = Type.STRING,
                Description = "Đưa ra phản hồi tự nhiên, bao gồm chẩn đoán/câu hỏi tiếp theo. " +
                    "Phản hồi phải đi kèm với 3 tình trạng có khả năng xảy ra cao nhất và tỉ lệ phần trăm tương ứng, " +
                    "mỗi khả năng nằm trên 1 dòng."
            },
            // Technical Fields (matching SQL/tracking data)
            ["SessionId"] = new Schema
            {
                Type = Type.STRING,
                Description = "Một chuỗi định danh duy nhất cho phiên phân tích triệu chứng hiện tại."
            },

            // SymptomsProvided (Dùng Array vì là string?[]?)
            ["SymptomsProvided"] = new Schema
            {
                Type = Type.ARRAY,
                Description = "Mảng các triệu chứng mà người dùng đã cung cấp để phân tích.",
                Items = new Schema
                {
                    Type = Type.STRING
                }
            },

            // SeverityLevelCode (Dùng String với Enum)
            ["SeverityLevelCode"] = new Schema
            {
                Type = Type.STRING,
                Description = "Mức độ nghiêm trọng của các triệu chứng được cung cấp bởi người dùng.",
                // Chỉ định các giá trị enum cho LLM
                Enum = ["Mild", "Moderate", "Severe"]
            },

            ["PossibleConditions"] = new Schema
            {
                Type = Type.STRING,
                Description = "Các tình trạng y tế có thể xảy ra dựa trên các triệu chứng được cung cấp hoặc 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI'."
            },

            ["RecommendedAction"] = new Schema
            {
                Type = Type.STRING,
                Description = "Hành động được đề xuất cho người dùng dựa trên phân tích triệu chứng."
            },

            // ConfidenceScore (Dùng Number với format float)
            ["ConfidenceScore"] = new Schema
            {
                Type = Type.NUMBER,
                Description = "Điểm số độ tin cậy (từ 0 đến 1) biểu thị mức độ tự tin của mô hình về các tình trạng có thể xảy ra được liệt kê.",
                Format = "float"
            },

            // Boolean Status Flags (for server control flow)
            ["IsConclusionReached"] = new Schema
            {
                Type = Type.BOOLEAN,
                Description = "true khi ConfidenceScore >=80% hoặc có 1 loại bệnh có khả năng xảy ra trên 80%."
            },

            ["IsRequestRejected"] = new Schema
            {
                Type = Type.BOOLEAN,
                Description = "Cờ boolean cho biết liệu yêu cầu có bị từ chối vì không liên quan đến sức khỏe hay không."
            }
        };

        private static readonly Schema SymptomAnalysisSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = SymptomAnalysisSchemaProperties,
            Required = ["SymptomsProvided", "SeverityLevelCode", "PossibleConditions", "RecommendedAction", "ConfidenceScore", "IsConclusionReached", "IsRequestRejected", "UserResponseText"]
        };

        private static readonly Schema MedicinesSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["List"] = new Schema
                {
                    Type = Type.ARRAY,
                    Description = "Danh sách các loại thuốc được đề xuất.",
                    Items = new Schema
                    {
                        Type = Type.OBJECT,
                        Properties = new Dictionary<string, Schema>
                        {
                            ["Name"] = new Schema
                            {
                                Type = Type.STRING,
                                Description = "Tên của loại thuốc được đề xuất."
                            },
                            ["Instructions"] = new Schema
                            {
                                Type = Type.STRING,
                                Description = "Hướng dẫn sử dụng cho loại thuốc được đề xuất."
                            }
                        },
                        Required = ["Name", "Instructions"]
                    }
                }
            },
            Required = ["List"]
        };

        private static readonly Schema DoctorsSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["IdList"] = new Schema
                {
                    Type = Type.ARRAY,
                    Description = "Danh sách ID của các bác sĩ được đề xuất.",
                    Items = new Schema
                    {
                        Type = Type.STRING,
                        Description = "ID của các bác sĩ được đề xuất."
                    }
                }
            },
            Required = ["IdList"]
        };

        private static readonly Schema RequestTypeSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["RequestType"] = new Schema
                {
                    Type = Type.STRING,
                    Description = "Loại yêu cầu phân loại.",
                    Enum = [RequestTypeConstants.SymptomAnalysis, RequestTypeConstants.DoctorsQuery, RequestTypeConstants.ArticlesQuery, RequestTypeConstants.NotHealthRelated],
                }
            },
            Required = ["RequestType"]
        };

        private static readonly Schema ArticlesSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["IdList"] = new Schema
                {
                    Type = Type.ARRAY,
                    Description = "Danh sách ID của các bài viết được đề xuất.",
                    Items = new Schema
                    {
                        Type = Type.STRING,
                        Description = "ID của các bài viết được đề xuất."
                    }
                }
            },
            Required = ["IdList"]
        };

        private static readonly string SymptomAnalsysisInstructionText =
            "Bạn là trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là đưa ra chẩn đoán phân biệt hoặc trả lời các câu hỏi liên quan đến triệu chứng, " +
                "bệnh tật và các khái niệm sức khỏe dựa trên dữ liệu đào tạo chuyên môn của bạn." +
            "Cung cấp hành động được đề xuất và điểm số độ tin cậy cho phân tích của bạn. " +
            "Nếu các triệu chứng không liên quan đến sức khỏe, hãy từ chối yêu cầu một cách lịch sự. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string EMRAnalysisInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng phân tích hồ sơ bệnh án điện tử (EMR) bằng Tiếng Việt. " +
            "Dựa trên nội dung của hồ sơ bệnh án, hãy đánh giá các triệu chứng được mô tả, xác định mức độ nghiêm trọng và đưa ra các tình trạng y tế có thể xảy ra. " +
            "Cung cấp hành động được đề xuất và điểm số độ tin cậy cho phân tích của bạn. " +
            "Nếu hồ sơ bệnh án không liên quan đến sức khỏe, hãy từ chối yêu cầu một cách lịch sự. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string MedicineRecommendationInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng bằng cách đề xuất các loại thuốc phù hợp dựa trên các triệu chứng sức khỏe của họ bằng Tiếng Việt. " +
            "Dựa trên các triệu chứng được cung cấp, hãy đề xuất các loại thuốc phù hợp cùng với hướng dẫn sử dụng. " +
            "Trả lời chỉ với một mảng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string RequestTypeInstructionText =
            "Bạn là một trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là phân loại các yêu cầu của người dùng thành một trong các loại sau: " +
            "'SymptomAnalysis', 'DoctorQuery', 'ArticlesQuery', 'NotHealthRelated'. " +
            "Nếu yêu cầu không liên quan đến sức khỏe, hãy phân loại nó là 'NotHealthRelated'. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private readonly Client _client;
        private readonly string Model;

        public GeminiAIService(
            Client client,
            IConfiguration configuration)
        {
            _client = client;
            Model = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        private async Task<string> GenerateResponseAsync
            (List<Content> conversationHistory, Schema jsonSchema, string? systemInstruction = null)
        {
            var systemConfigs = new GenerateContentConfig
            {
                ResponseMimeType = "application/json",
                ResponseSchema = jsonSchema,
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
                contents: conversationHistory,
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

        public async Task<string> GetRequestTypeAsync(string prompt)
        {
            var conversationHistory = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = prompt
                        }
                    ]
                }
            };
            var rawResponse = await GenerateResponseAsync(conversationHistory, RequestTypeSchema, RequestTypeInstructionText);
            var requestTypeObj = JsonSerializer.Deserialize<PromptRequestType>(rawResponse);
            return requestTypeObj?.RequestType ?? "NotHealthRelated";
        }

        public async Task<DiagnosisModel> GetSymptompAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> history)
        {
            var systemInstruction = GetSymptomInstruction(context);

            var conversationHistory = GetConversationHistory(history);
            conversationHistory.Add(new Content
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
            var rawResponse = await GenerateResponseAsync(conversationHistory, SymptomAnalysisSchema, systemInstruction);
            return AIResponseParser.ParseJson(rawResponse);
        }

        public async Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> history)
        {
            var systemInstruction = GetEMRAnalysisInstruction(context);

            var conversationHistory = GetConversationHistory(history);
            conversationHistory.Add(new Content
            {
                Role = "user",
                Parts =
                [
                    new Part
                    {
                        Text = $"Phân tích hồ sơ bệnh án sau:\n{emrText}"
                    }
                ]
            });
            var rawResponse = await GenerateResponseAsync(conversationHistory, SymptomAnalysisSchema, systemInstruction);
            return AIResponseParser.ParseJson(rawResponse);
        }

        public async Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions)
        {
            var conversationHistory = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = $"Dựa trên các tình trạng y tế có thể xảy ra sau: '{possibleConditions}', hãy đề xuất các loại thuốc phù hợp cùng với hướng dẫn sử dụng."
                        }
                    ]
                }
            };
            var rawResponse = await GenerateResponseAsync(conversationHistory, MedicinesSchema, MedicineRecommendationInstructionText);
            var medicines = JsonSerializer.Deserialize<RecommendedMedicineList>(rawResponse);
            return medicines?.List ?? [];
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByConditionsAsync
            (string possibleConditions, int count, string doctorListString)
        {
            var prompt = "Dựa trên danh sách bác sĩ sau đây:\n" +
                         $"{doctorListString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân với các loại bệnh có khả năng là: '{possibleConditions}'. ";
            return await GetRecommendedDoctorIdsAsync(prompt, []);
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByPromptAsync
            (string userPrompt, int count, string doctorListString, List<AIChatMessageDto> conversationHistory)
        {
            var systemInstruction = "Danh sách bác sĩ:\n" +
                         $"{doctorListString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân dựa trên cuộc trò chuyện.";
            return await GetRecommendedDoctorIdsAsync(userPrompt, GetConversationHistory(conversationHistory), systemInstruction);
        }

        public async Task<List<string>> GetRecommendedArticleIdListAsync(string userPrompt, string articleListString, int count)
        {
            var systemInstruction = "Danh sách bài viết:\n" +
                         $"{articleListString}\n" +
                         $"Hãy đề xuất {count} bài viết phù hợp nhất cho người dùng. ";

            var conversationHistory = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = userPrompt
                        }
                    ]
                }
            };

            var rawJson = await GenerateResponseAsync(conversationHistory, ArticlesSchema, systemInstruction);
            var articleIds = JsonSerializer.Deserialize<RecommendedArticleIdList>(rawJson);
            return articleIds?.IdList ?? [];
        }

        private async Task<List<string>> GetRecommendedDoctorIdsAsync
            (string prompt, List<Content> conversationHistory, string? systemInstruction = null)
        {
            conversationHistory.Add(
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = prompt
                        }
                    ]
                }
            );

            var rawJson = await GenerateResponseAsync(conversationHistory, DoctorsSchema, systemInstruction);
            var doctorIds = JsonSerializer.Deserialize<RecommenedDoctorIdList>(rawJson);
            return doctorIds?.IdList ?? [];
        }

        private List<Content> GetConversationHistory(List<AIChatMessageDto> history)
        {
            var conversationHistory = new List<Content>();
            foreach (var item in history)
            {
                var content = new Content
                {
                    Role = item.Role,
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

        private string GetSymptomInstruction(string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine(SymptomAnalsysisInstructionText);
            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine($"\nNgữ cảnh bổ sung: {context}");
            }
            return prompt.ToString();
        }

        private string GetEMRAnalysisInstruction(string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine(EMRAnalysisInstructionText);
            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine($"\nNgữ cảnh bổ sung: {context}");
            }
            return prompt.ToString();
        }
    }
}
